
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db

from app.integrations.whatsapp.client import send_text_message
from app.integrations.whatsapp.schemas import (
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
    db: Session = Depends(get_db)
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

    # 5. Traitement des messages
    processed_count = 0
    fallback_count = 0
    failed_count = 0

    for incoming_message in valid_messages:

        message_id = incoming_message.message_id

        logger.info(
            "Processing incoming WhatsApp message. Message ID: %s",
            message_id
        )

        # ----------------------------------------------------
        # ÉTAPE A : TRAITEMENT PAR LE CHATBOT
        # ----------------------------------------------------

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
                "Chatbot response generated successfully. "
                "Message ID: %s",
                message_id
            )

        except Exception:

            logger.exception(
                "Chatbot processing failed. "
                "Message ID: %s",
                message_id
            )

            # Réponse statique indépendante de Gemini
            response_message = FALLBACK_MESSAGE

            fallback_count += 1

        # ----------------------------------------------------
        # ÉTAPE B : ENVOI DE LA RÉPONSE SUR WHATSAPP
        # ----------------------------------------------------

        try:

            send_result = await send_text_message(
                recipient_phone=incoming_message.customer_phone,
                message=response_message
            )

            processed_count += 1

            logger.info(
                "WhatsApp response sent successfully. "
                "Message ID: %s",
                message_id
            )

            if fallback_count > 0:
                logger.info(
                    "Fallback response used for message ID: %s",
                    message_id
                )

        except Exception:

            failed_count += 1

            logger.exception(
                "Failed to send WhatsApp response. "
                "Message ID: %s",
                message_id
            )

    # 6. Résultat global
    if failed_count == 0:

        status = "success"

    elif processed_count > 0:

        status = "partial_success"

    else:

        status = "failed"

    logger.info(
        "WhatsApp webhook processing completed. "
        "Received: %s | Sent: %s | Fallback: %s | Failed: %s",
        len(valid_messages),
        processed_count,
        fallback_count,
        failed_count
    )

    return {
        "status": status,
        "messages_received": len(valid_messages),
        "messages_processed": processed_count,
        "fallback_responses": fallback_count,
        "messages_failed": failed_count
    }
