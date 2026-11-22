
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# Configuration de base
class WhatsAppBaseSchema(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True
    )


# Informations de contact
class WhatsAppProfile(WhatsAppBaseSchema):
    name: Optional[str] = None


class WhatsAppContact(WhatsAppBaseSchema):
    profile: Optional[WhatsAppProfile] = None
    wa_id: Optional[str] = None


# Contenu du message
class WhatsAppText(WhatsAppBaseSchema):
    body: str


class WhatsAppIncomingMessage(WhatsAppBaseSchema):
    message_id: str = Field(alias="id")
    sender: str = Field(alias="from")
    timestamp: Optional[str] = None
    message_type: str = Field(alias="type")

    text: Optional[WhatsAppText] = None


# Métadonnées du Webhook
class WhatsAppMetadata(WhatsAppBaseSchema):
    display_phone_number: Optional[str] = None
    phone_number_id: Optional[str] = None


# Valeur du Webhook
class WhatsAppWebhookValue(WhatsAppBaseSchema):
    messaging_product: Optional[str] = None

    metadata: Optional[WhatsAppMetadata] = None

    contacts: list[WhatsAppContact] = Field(
        default_factory=list
    )

    messages: list[WhatsAppIncomingMessage] = Field(
        default_factory=list
    )


# Changements du Webhook
class WhatsAppWebhookChange(WhatsAppBaseSchema):
    field: Optional[str] = None
    value: WhatsAppWebhookValue


# Entrée du Webhook
class WhatsAppWebhookEntry(WhatsAppBaseSchema):
    id: Optional[str] = None
    changes: list[WhatsAppWebhookChange] = Field(
        default_factory=list
    )


# Payload principal du Webhook
class WhatsAppWebhookPayload(WhatsAppBaseSchema):
    object: str
    entry: list[WhatsAppWebhookEntry] = Field(
        default_factory=list
    )


# Message client normalisé
class ExtractedWhatsAppMessage(BaseModel):
    message_id: str
    customer_phone: str
    customer_name: Optional[str] = None
    message_text: str
    business_phone_number_id: Optional[str] = None


# Extraction des messages texte
def extract_text_messages(
    payload: WhatsAppWebhookPayload
) -> list[ExtractedWhatsAppMessage]:
    """
    Extract incoming text messages from a WhatsApp webhook.

    Ignores delivery/read statuses and unsupported message types.
    Also extracts the receiving WhatsApp Business phone number ID.
    """

    extracted_messages = []

    for entry in payload.entry:

        for change in entry.changes:

            # We only process message events
            if change.field != "messages":
                continue

            value = change.value

            business_phone_number_id = (
                value.metadata.phone_number_id
                if value.metadata
                else None
            )

            # Map WhatsApp IDs to customer names
            contacts = {
                contact.wa_id: contact.profile.name
                for contact in value.contacts
                if (
                    contact.wa_id
                    and contact.profile
                    and contact.profile.name
                )
            }

            for message in value.messages:

                if message.message_type != "text":
                    continue

                if not message.text or not message.text.body.strip():
                    continue

                extracted_messages.append(
                    ExtractedWhatsAppMessage(
                        message_id=message.message_id,
                        customer_phone=message.sender,
                        customer_name=contacts.get(message.sender),
                        message_text=message.text.body.strip(),
                        business_phone_number_id=business_phone_number_id
                    )
                )

    return extracted_messages
