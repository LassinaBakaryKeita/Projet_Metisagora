import asyncio
import json
import logging
import time

from decimal import Decimal

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


# ============================================================
# CONFIGURATION GEMINI & CIRCUIT BREAKER
# ============================================================

# Modèles ordonnés par disponibilité, rapidité et stabilité actuelles
GEMINI_MODELS = [
    "gemini-3.5-flash-lite",  # Très rapide, ultra disponible
    "gemini-3.5-flash",       # Robuste et stable
    "gemini-3.8-flash",       # Modèle supérieur de secours
    "gemini-3.1-flash-lite"   # Dernier recours
]

# Erreurs temporaires justifiant un basculement immédiat
RETRYABLE_STATUS_CODES = {
    408, 429, 500, 502, 503, 504
}

# Circuit Breaker dynamique en mémoire
# Évite de réinterroger un modèle saturé (503/429) pendant 3 minutes
MODEL_COOLDOWNS: dict[str, float] = {}
COOLDOWN_DURATION_SECONDS = 180.0

# Timeout strict par requête : coupe court si Google tarde à répondre (évite de bloquer 20s)
MODEL_TIMEOUT_SECONDS = 8.0


def is_retryable_error(error: Exception) -> bool:
    if isinstance(error, (asyncio.TimeoutError, TimeoutError)):
        return True

    status_code = getattr(error, "code", None)
    if status_code is None:
        status_code = getattr(error, "status_code", None)

    if status_code is None:
        err_str = str(error)
        for code in RETRYABLE_STATUS_CODES:
            if str(code) in err_str:
                return True
        return False

    try:
        status_code = int(status_code)
    except (TypeError, ValueError):
        return False

    return status_code in RETRYABLE_STATUS_CODES


def get_prioritized_models() -> list[str]:
    """
    Retourne la liste des modèles en plaçant en premier
    les modèles qui ne sont pas en période de refroidissement (cooldown).
    """
    now = time.time()
    available = []
    in_cooldown = []

    for model in GEMINI_MODELS:
        cooldown_until = MODEL_COOLDOWNS.get(model, 0.0)
        if now >= cooldown_until:
            available.append(model)
        else:
            in_cooldown.append(model)

    # Si tous les modèles sont en cooldown, on les réessaie tous pour ne pas bloquer
    if not available:
        logger.warning(
            "Tous les modèles Gemini étaient en cooldown. Réinitialisation globale."
        )
        MODEL_COOLDOWNS.clear()
        return list(GEMINI_MODELS)

    # D'abord les modèles sains, puis ceux en cooldown en dernier recours
    return available + in_cooldown


async def generate_with_fallback(
    client: genai.Client,
    contents: str,
    system_instruction: str,
    temperature: float,
    response_mime_type: str | None = None
):
    models_to_try = get_prioritized_models()
    last_error = None

    for index, model in enumerate(models_to_try):
        try:
            logger.info("Tentative avec le modèle Gemini: %s", model)

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type=response_mime_type
            )

            # Timeout strict pour basculer rapidement si Google bloque
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                ),
                timeout=MODEL_TIMEOUT_SECONDS
            )

            if response.text and response.text.strip():
                # Succès : sortie immédiate du cooldown pour ce modèle
                MODEL_COOLDOWNS.pop(model, None)
                logger.info("Succès génération avec le modèle: %s", model)
                return response

            raise ValueError("Gemini a retourné une réponse vide.")

        except Exception as error:
            last_error = error

            if not is_retryable_error(error):
                logger.exception("Erreur non réessayable avec le modèle %s: %s", model, error)
                raise

            # Modèle saturé (503 / 429 / timeout) : mise en quarantaine 3 minutes
            MODEL_COOLDOWNS[model] = time.time() + COOLDOWN_DURATION_SECONDS
            logger.warning(
                "Modèle %s temporairement indisponible (placé en quarantaine 3 min). Erreur: %s",
                model,
                error
            )

            if index == len(models_to_try) - 1:
                break

    if last_error:
        raise last_error

    raise RuntimeError("Aucun modèle Gemini n'a pu générer de réponse.")


# ============================================================
# PHASE A : ANALYSE DE L'INTENTION
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

    return IntentAnalysis.model_validate_json(response.text)


# ============================================================
# RECHERCHE DANS LE CATALOGUE
# ============================================================

def search_relevant_products(
    db: Session,
    intent_analysis: IntentAnalysis
) -> list[ProductContext]:

    intent = intent_analysis.intent

    products = []

    # 1. Catalogue général
    if intent == CustomerIntent.PRODUCT_LIST:

        products = product_service.get_catalog_products(db)

        if intent_analysis.stock_filter == "in_stock":
            products = [
                product for product in products
                if product.stock > 0
            ]

        elif intent_analysis.stock_filter == "out_of_stock":
            products = [
                product for product in products
                if product.stock == 0
            ]

    # 2. Produit le plus cher ou le moins cher
    elif intent in {
        CustomerIntent.MOST_EXPENSIVE,
        CustomerIntent.CHEAPEST
    }:

        product = product_service.get_extreme_price_product(
            db=db,
            highest=(intent == CustomerIntent.MOST_EXPENSIVE)
        )

        if product:
            products = [product]

    # 3. Recherches ciblées
    elif intent in {
        CustomerIntent.PRODUCT_SEARCH,
        CustomerIntent.PRODUCT_DETAILS,
        CustomerIntent.PRICE_INQUIRY,
        CustomerIntent.STOCK_INQUIRY,
        CustomerIntent.AVAILABILITY_SEARCH,
        CustomerIntent.PRODUCT_COMPARISON,
        CustomerIntent.PRODUCT_RECOMMENDATION
    }:

        search_terms = list(intent_analysis.product_names)

        if intent_analysis.product_name:
            search_terms.insert(0, intent_analysis.product_name)

        if not search_terms and intent_analysis.search_query:
            search_terms.append(intent_analysis.search_query)

        found_products = {}

        for term in search_terms:

            results = product_service.search_products_for_chatbot(
                db=db,
                search=term
            )

            for product in results:
                found_products[product.id] = product

        products = list(found_products.values())

    # Conversion des modèles SQLAlchemy
    return [
        ProductContext(
            id=product.id,
            name=product.name,
            description=product.description,
            price=Decimal(str(product.price)),
            stock=product.stock
        )
        for product in products
    ]


# ============================================================
# ESCALADE HUMAINE
# ============================================================

def should_escalate(
    intent_analysis: IntentAnalysis
) -> bool:

    if intent_analysis.intent in {
        CustomerIntent.HUMAN_REQUEST,
        CustomerIntent.COMPLAINT,
        CustomerIntent.ORDER_ISSUE
    }:
        return True

    return intent_analysis.escalation_recommended


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
        if intent_analysis.intent in {
            CustomerIntent.HUMAN_REQUEST,
            CustomerIntent.COMPLAINT,
            CustomerIntent.ORDER_ISSUE
        }
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
# PHASE B : GÉNÉRATION DE LA RÉPONSE
# ============================================================

async def generate_customer_response(
    client: genai.Client,
    customer_message: str,
    intent_analysis: IntentAnalysis,
    products: list[ProductContext]
) -> str:

    context = {
        "customer_message": customer_message,
        "intent_analysis": intent_analysis.model_dump(mode="json"),
        "products_from_database": [
            product.model_dump(mode="json")
            for product in products
        ],
        "products_found": len(products)
    }

    response = await generate_with_fallback(
        client=client,
        contents=json.dumps(
            context,
            ensure_ascii=False,
            indent=2
        ),
        system_instruction=CUSTOMER_RESPONSE_PROMPT,
        temperature=0.4
    )

    return response.text.strip()


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

    # PHASE A : compréhension du message
    intent_analysis = await analyze_customer_intent(
        client=client,
        customer_message=customer_message
    )

    logger.info(
        "Detected customer intent: %s",
        intent_analysis.intent.value
    )

    # Escalade humaine
    if should_escalate(intent_analysis):

        reason = create_escalation_notification(
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
            escalation_reason=reason,
            intent=intent_analysis.intent
        )

    # Récupération des données PostgreSQL
    products = search_relevant_products(
        db=db,
        intent_analysis=intent_analysis
    )

    logger.info(
        "Products retrieved from database: %s",
        len(products)
    )

    # PHASE B : formulation de la réponse
    customer_response = await generate_customer_response(
        client=client,
        customer_message=customer_message,
        intent_analysis=intent_analysis,
        products=products
    )

    return ChatbotResponse(
        message=customer_response,
        escalated=False,
        intent=intent_analysis.intent
    )