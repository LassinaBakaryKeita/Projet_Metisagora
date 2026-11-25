
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from google import genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import SessionLocal

from app.integrations.whatsapp.client import send_text_message
from app.integrations.whatsapp.schemas import (
    ExtractedWhatsAppMessage,
    WhatsAppWebhookPayload,
    extract_text_messages
)

from app.modules.chatbot.service import process_customer_message


logger = logging.getLogger(__name__)


router = APIRouter(
    tags=["WhatsApp Webhook"]
)



# CONFIGURATION


FALLBACK_MESSAGE = (
    "Bonjour ! 😊 Nous rencontrons actuellement une difficulté "
    "technique pour traiter votre demande. "
    "Pourriez-vous réessayer dans quelques instants ? "
    "Merci pour votre compréhension."
)


async def process_and_send_whatsapp_response(
    incoming_message: ExtractedWhatsAppMessage,
    gemini_client: genai.Client
) -> None:
    """
    Tâche d'arrière-plan (Background Task) pour traiter le message
    avec l'IA et envoyer la réponse sur WhatsApp.
    Permet au Webhook Meta de recevoir un 200 OK immédiat (< 100ms)
    et élimine tout risque de timeout Meta (15s).
    """
    message_id = incoming_message.message_id
    db: Session = SessionLocal()

    try:
        logger.info(
            "Background: Début du traitement du message WhatsApp ID: %s",
            message_id
        )

        try:
            chatbot_response = await process_customer_message(
                db=db,
                client=gemini_client,
                customer_message=incoming_message.message_text,
                customer_phone=incoming_message.customer_phone,
                customer_name=incoming_message.customer_name
            )
            response_message = chatbot_response.message

            logger.info(
                "Background: Réponse IA générée avec succès pour le message ID: %s",
                message_id
            )

        except Exception:
            logger.exception(
                "Background: Échec traitement chatbot pour le message ID: %s",
                message_id
            )
            response_message = FALLBACK_MESSAGE

        # Envoi de la réponse sur WhatsApp
        await send_text_message(
            recipient_phone=incoming_message.customer_phone,
            message=response_message
        )

        logger.info(
            "Background: Réponse WhatsApp envoyée avec succès au client %s",
            incoming_message.customer_phone
        )

    except Exception:
        logger.exception(
            "Background: Erreur fatale lors de l'envoi WhatsApp pour le message ID: %s",
            message_id
        )

    finally:
        db.close()


# ============================================================
# GET : VÉRIFICATION DU WEBHOOK META
# ============================================================

@router.get(
    "/webhook",
    response_class=PlainTextResponse
)
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge")
):

    expected_token = (
        settings.whatsapp_verify_token.get_secret_value()
    )

    if mode == "subscribe" and token == expected_token:

        logger.info(
            "WhatsApp webhook verified successfully."
        )

        return challenge

    logger.warning(
        "WhatsApp webhook verification failed."
    )

    raise HTTPException(
        status_code=403,
        detail="Webhook verification failed."
    )


# ============================================================
# POST : RÉCEPTION DES MESSAGES WHATSAPP
# ============================================================

@router.post("/webhook")
async def receive_whatsapp_message(
    payload: WhatsAppWebhookPayload,
    request: Request,
    background_tasks: BackgroundTasks
):

    logger.info(
        "Incoming WhatsApp webhook received."
    )

    # 1. Vérification du type d'événement
    if payload.object != "whatsapp_business_account":

        logger.info(
            "Ignoring unsupported webhook object: %s",
            payload.object
        )

        return {
            "status": "ignored",
            "reason": "Unsupported webhook object."
        }

    # 2. Extraction des messages texte
    incoming_messages = extract_text_messages(payload)

    if not incoming_messages:

        logger.info(
            "Webhook received without incoming text messages."
        )

        return {
            "status": "received",
            "messages_processed": 0
        }

    # 3. Vérification du numéro Business configuré
    configured_phone_number_id = str(
        settings.whatsapp_phone_number_id
    ).strip()

    valid_messages = []

    for incoming_message in incoming_messages:

        received_phone_number_id = str(
            incoming_message.business_phone_number_id or ""
        ).strip()

        if (
            configured_phone_number_id
            and received_phone_number_id != configured_phone_number_id
        ):

            logger.warning(
                "Ignoring message from unexpected WhatsApp "
                "Business Phone Number ID. Message ID: %s",
                incoming_message.message_id
            )

            continue

        valid_messages.append(incoming_message)

    if not valid_messages:

        logger.warning(
            "No message belongs to the configured Business number."
        )

        return {
            "status": "ignored",
            "reason": "No message belongs to the configured Business number."
        }

    # 4. Récupération du client Gemini partagé
    gemini_client = request.app.state.gemini_client

    # 5. Planification immédiate en arrière-plan
    # Réponse instantanée à Meta (HTTP 200) pour garantir zéro timeout
    for incoming_message in valid_messages:
        background_tasks.add_task(
            process_and_send_whatsapp_response,
            incoming_message=incoming_message,
            gemini_client=gemini_client
        )

    logger.info(
        "WhatsApp webhook acknowledged. %s message(s) queued for processing.",
        len(valid_messages)
    )

    return {
        "status": "success",
        "messages_received": len(valid_messages),
        "messages_queued": len(valid_messages)
    }
