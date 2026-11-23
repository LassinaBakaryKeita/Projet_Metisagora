
import json
import logging

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.integrations.ai.prompts import (
    INTENT_ANALYSIS_PROMPT,
    CUSTOMER_RESPONSE_PROMPT
)

from app.modules.chatbot.schemas import (
    CustomerIntent,
    IntentAnalysis,
    ProductContext,
    ChatbotResponse
)

from app.modules.products import service as product_service

from app.modules.notifications import service as notification_service
from app.modules.notifications.schemas import NotificationCreate


logger = logging.getLogger(__name__)



# CONFIGURATION DES MODÈLES GEMINI


GEMINI_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
]

# Erreurs temporaires pouvant justifier un changement de modèle
RETRYABLE_STATUS_CODES = {
    408, 429, 500, 502, 503, 504
}


# ============================================================
# GÉNÉRATION AVEC FALLBACK
# ============================================================

def is_retryable_error(error: Exception) -> bool:
    """
    Determines whether an error is temporary
    and whether another Gemini model should be tried.
    """

    status_code = getattr(error, "code", None)

    if status_code is None:
        status_code = getattr(error, "status_code", None)

    try:
        status_code = int(status_code)
    except (TypeError, ValueError):
        return False

    return status_code in RETRYABLE_STATUS_CODES


async def generate_with_fallback(
    client: genai.Client,
    contents: str,
    system_instruction: str,
    temperature: float,
    response_mime_type: str | None = None
):
    """
    Tries Gemini models sequentially.

    If a model encounters a temporary availability error,
    the next model is automatically used.
    """

    last_error = None

    for index, model in enumerate(GEMINI_MODELS):

        try:
            logger.info(
                "Trying Gemini model: %s",
                model
            )

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type=response_mime_type
            )

            response = await client.aio.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )

            logger.info(
                "Gemini response generated successfully "
                "using model: %s",
                model
            )

            return response

        except Exception as error:

            last_error = error

            # Do not switch models for permanent errors
            if not is_retryable_error(error):
                logger.exception(
                    "Non-retryable Gemini error with model %s",
                    model
                )
                raise

            logger.warning(
                "Gemini model %s is temporarily unavailable. "
                "Trying the next model. Error: %s",
                model,
                error
            )

            # No more models available
            if index == len(GEMINI_MODELS) - 1:
                break

    logger.error(
        "All Gemini models are currently unavailable."
    )

    if last_error:
        raise last_error

    raise RuntimeError(
        "No Gemini model could generate a response."
    )


# ============================================================
# PHASE A : ANALYSE DE L'INTENTION DU CLIENT
# ============================================================

async def analyze_customer_intent(
    client: genai.Client,
    customer_message: str
) -> IntentAnalysis:

    response = await generate_with_fallback(
        client=client,
        contents=customer_message,
        system_instruction=INTENT_ANALYSIS_PROMPT,
        temperature=0,
        response_mime_type="application/json"
    )

    content = response.text

    if not content:
        raise ValueError(
            "Gemini returned an empty intent analysis."
        )

    # Strict validation with Pydantic
    return IntentAnalysis.model_validate_json(content)


# ============================================================
# RECHERCHE DES PRODUITS DANS POSTGRESQL
# ============================================================

def search_relevant_products(
    db: Session,
    intent_analysis: IntentAnalysis
) -> list[ProductContext]:

    product_intents = {
        CustomerIntent.PRODUCT_SEARCH,
        CustomerIntent.PRICE_INQUIRY,
        CustomerIntent.STOCK_INQUIRY
    }

    if intent_analysis.intent not in product_intents:
        return []

    if not intent_analysis.product_name:
        return []

    result = product_service.get_products(
        db=db,
        page=1,
        limit=10,
        search=intent_analysis.product_name
    )

    products = result["items"]

    return [
        ProductContext(
            id=product.id,
            name=product.name,
            description=product.description,
            price=float(product.price),
            stock=product.stock
        )
        for product in products
    ]


# ============================================================
# DÉCISION MÉTIER : ESCALADE HUMAINE
# ============================================================

def should_escalate(
    intent_analysis: IntentAnalysis
) -> bool:

    if intent_analysis.intent == CustomerIntent.HUMAN_REQUEST:
        return True

    if intent_analysis.escalation_recommended:
        return True

    return False


# ============================================================
# CRÉATION D'UNE NOTIFICATION
# ============================================================

def create_escalation_notification(
    db: Session,
    customer_message: str,
    customer_phone: str,
    customer_name: str | None,
    intent_analysis: IntentAnalysis
) -> str:

    reason = (
        intent_analysis.escalation_reason
        or "Une intervention humaine est nécessaire."
    )

    priority = (
        "high"
        if intent_analysis.intent == CustomerIntent.HUMAN_REQUEST
        else "medium"
    )

    notification_data = NotificationCreate(
        customer_phone=customer_phone,
        customer_name=customer_name,
        message=customer_message,
        reason=reason,
        priority=priority
    )

    notification_service.create_notification(
        db=db,
        notification_data=notification_data
    )

    return reason


# ============================================================
# PHASE B : GÉNÉRATION DE LA RÉPONSE AU CLIENT
# ============================================================

async def generate_customer_response(
    client: genai.Client,
    customer_message: str,
    intent_analysis: IntentAnalysis,
    products: list[ProductContext]
) -> str:

    product_data = [
        product.model_dump(mode="json")
        for product in products
    ]

    context = {
        "customer_message": customer_message,
        "intent_analysis": intent_analysis.model_dump(mode="json"),
        "products_from_database": product_data
    }

    response = await generate_with_fallback(
        client=client,
        contents=(
            "Voici le contexte de la conversation et "
            "les données commerciales disponibles.\n\n"
            + json.dumps(
                context,
                ensure_ascii=False,
                indent=2
            )
        ),
        system_instruction=CUSTOMER_RESPONSE_PROMPT,
        temperature=0.4
    )

    content = response.text

    if not content:
        raise ValueError(
            "Gemini returned an empty customer response."
        )

    return content.strip()


# ============================================================
# ORCHESTRATEUR PRINCIPAL
# ============================================================

async def process_customer_message(
    db: Session,
    client: genai.Client,
    customer_message: str,
    customer_phone: str,
    customer_name: str | None = None
) -> ChatbotResponse:

    # Phase A : Analyse de l'intention
    intent_analysis = await analyze_customer_intent(
        client=client,
        customer_message=customer_message
    )

    # Vérification d'une éventuelle escalade humaine
    if should_escalate(intent_analysis):

        escalation_reason = create_escalation_notification(
            db=db,
            customer_message=customer_message,
            customer_phone=customer_phone,
            customer_name=customer_name,
            intent_analysis=intent_analysis
        )

        return ChatbotResponse(
            message=(
                "Merci pour votre message ! 😊 "
                "Votre demande a été transmise à notre équipe. "
                "Un membre de notre équipe reviendra vers vous "
                "dans les meilleurs délais."
            ),
            escalated=True,
            escalation_reason=escalation_reason,
            intent=intent_analysis.intent
        )

    # Recherche des produits dans PostgreSQL
    products = search_relevant_products(
        db=db,
        intent_analysis=intent_analysis
    )

    # Phase B : Génération de la réponse
    customer_response = await generate_customer_response(
        client=client,
        customer_message=customer_message,
        intent_analysis=intent_analysis,
        products=products
    )

    return ChatbotResponse(
        message=customer_response,
        escalated=False,
        escalation_reason=None,
        intent=intent_analysis.intent
    )
