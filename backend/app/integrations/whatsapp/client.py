
import httpx

from app.core.config import settings



# SEND TEXT MESSAGE

async def send_text_message(
    recipient_phone: str,
    message: str,
    sender_phone_number_id: str | None = None
) -> dict:
    """
    Send a text message to a WhatsApp customer
    using Meta WhatsApp Cloud API.
    """
    token = settings.whatsapp_access_token.get_secret_value().strip()
    phone_id = (sender_phone_number_id or str(settings.whatsapp_phone_number_id)).strip()
    api_version = str(settings.whatsapp_api_version).strip()
    url = f"https://graph.facebook.com/{api_version}/{phone_id}/messages"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                url,
                headers=headers,
                json=payload
            )

            response.raise_for_status()

            return response.json()

    except httpx.HTTPStatusError as error:

        try:
            error_details = error.response.json()
        except ValueError:
            error_details = error.response.text

        raise RuntimeError(
            f"WhatsApp API error "
            f"({error.response.status_code}): {error_details}"
        ) from error

    except httpx.RequestError as error:

        raise RuntimeError(
            f"Unable to connect to WhatsApp API: {error}"
        ) from error
