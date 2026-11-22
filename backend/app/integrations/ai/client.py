
from google import genai

from app.core.config import settings


def create_gemini_client() -> genai.Client:
    """
    Creates and configures the Gemini client.
    """

    return genai.Client(
        api_key=settings.gemini_api_key.get_secret_value()
    )
