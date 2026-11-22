
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


# GET - Vérification du Webhook Meta
@router.get(
    "/webhook",
    response_class=PlainTextResponse
)
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge")
):
    """
    Verify the WhatsApp webhook subscription with Meta.
    """

    expected_token = (
        settings.whatsapp_verify_token.get_secret_value()
    )

    if mode == "subscribe" and token == expected_token:

        logger.info("WhatsApp webhook verified successfully.")

        return challenge

    logger.warning("WhatsApp webhook verification failed.")

    raise HTTPException(
        status_code=403,
        detail="Webhook verification failed."
    )


# POST - Réception des messages WhatsApp
@router.post("/webhook")
async def receive_whatsapp_message(
    payload: WhatsAppWebhookPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Receive incoming WhatsApp events,
    process customer text messages and send replies.
    """
    print("\n🔔 [WHATSAPP WEBHOOK] Requête POST reçue de Meta !")

    # 1. Verify the event source type
    if payload.object != "whatsapp_business_account":
        print(f"⚠️ [WHATSAPP WEBHOOK] Objet ignoré : {payload.object}")
        logger.info("Ignoring unsupported webhook object.")
        return {
            "status": "ignored",
            "reason": "Unsupported webhook object."
        }

    # 2. Extract incoming text messages
    incoming_messages = extract_text_messages(payload)

    if not incoming_messages:
        print("ℹ️ [WHATSAPP WEBHOOK] Événement reçu (statut/livraison/lecture), aucun message texte à traiter.")
        logger.info("No incoming text messages to process.")
        return {
            "status": "received",
            "messages_processed": 0
        }

    print(f"📩 [WHATSAPP WEBHOOK] {len(incoming_messages)} message(s) texte extrait(s).")

    # 3. Verify that events concern our Business number
    configured_phone_number_id = str(
        settings.whatsapp_phone_number_id
    ).strip()

    valid_messages = []

    for incoming_message in incoming_messages:
        received_phone_number_id = str(
            incoming_message.business_phone_number_id or ""
        ).strip()

        if configured_phone_number_id and received_phone_number_id != configured_phone_number_id:
            print(
                f"⚠️ [WHATSAPP WEBHOOK] Ignoré : Phone Number ID différent ! "
                f"Reçu dans le message: '{received_phone_number_id}' vs configuré dans .env: '{configured_phone_number_id}'"
            )
            logger.warning(
                "Ignoring message from an unexpected "
                "WhatsApp Business phone number ID."
            )
            continue

        valid_messages.append(incoming_message)

    # Test samples and events for other numbers are acknowledged,
    # but never sent to Gemini or WhatsApp.
    if not valid_messages:
        print("⚠️ [WHATSAPP WEBHOOK] Aucun message ne correspond au numéro configuré.")
        return {
            "status": "ignored",
            "reason": "No message belongs to the configured Business number."
        }

    # 4. Retrieve the shared Gemini client
    gemini_client = request.app.state.gemini_client

    # 5. Process valid incoming messages
    processed_count = 0

    for incoming_message in valid_messages:
        try:
            print(f"💬 [WHATSAPP WEBHOOK] Message de {incoming_message.customer_phone} ({incoming_message.customer_name or 'Anonyme'}): \"{incoming_message.message_text}\"")
            print("🧠 [WHATSAPP WEBHOOK] Traitement par le chatbot IA...")

            chatbot_response = await process_customer_message(
                db=db,
                client=gemini_client,
                customer_message=incoming_message.message_text,
                customer_phone=incoming_message.customer_phone,
                customer_name=incoming_message.customer_name
            )

            print(f"🤖 [WHATSAPP WEBHOOK] Réponse générée : \"{chatbot_response.message}\"")
            print(f"📤 [WHATSAPP WEBHOOK] Envoi vers WhatsApp ({incoming_message.customer_phone})...")

            # 6. Send the chatbot response
            send_result = await send_text_message(
                recipient_phone=incoming_message.customer_phone,
                message=chatbot_response.message
            )

            processed_count += 1
            print(f"✅ [WHATSAPP WEBHOOK] Message envoyé avec succès ! Réponse API : {send_result}")

            logger.info(
                "WhatsApp message processed successfully. "
                "Message ID: %s",
                incoming_message.message_id
            )

        except Exception as error:
            print(f"❌ [WHATSAPP WEBHOOK ERREUR] Échec du traitement : {error}")
            logger.exception(
                "Failed to process WhatsApp message. "
                "Message ID: %s",
                incoming_message.message_id
            )

    return {
        "status": "success",
        "messages_processed": processed_count
    }
