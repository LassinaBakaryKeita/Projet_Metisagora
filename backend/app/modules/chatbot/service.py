
import json

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


# Configuration
GEMINI_MODEL = "gemini-3.1-flash-lite"


# Phase A : Analyse de l'intention
async def analyze_customer_intent(
    client: genai.Client,
    customer_message: str
) -> IntentAnalysis:

    response = await client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=customer_message,
        config=types.GenerateContentConfig(
            system_instruction=INTENT_ANALYSIS_PROMPT,
            response_mime_type="application/json",
            temperature=0
        )
    )

    content = response.text

    if not content:
        raise ValueError(
            "Gemini returned an empty intent analysis."
        )

    # Validation stricte avec Pydantic
    return IntentAnalysis.model_validate_json(content)


# Recherche des produits dans PostgreSQL
def search_relevant_products(
    db: Session,
    intent_analysis: IntentAnalysis
) -> list[ProductContext]:

    # La recherche concerne uniquement les intentions commerciales
    product_intents = {
        CustomerIntent.PRODUCT_SEARCH,
        CustomerIntent.PRICE_INQUIRY,
        CustomerIntent.STOCK_INQUIRY
    }

    if intent_analysis.intent not in product_intents:
        return []

    # Si le nom du produit manque, inutile de lancer une recherche
    if not intent_analysis.product_name:
        return []

    # Recherche dans PostgreSQL
    result = product_service.get_products(
        db=db,
        page=1,
        limit=10,
        search=intent_analysis.product_name
    )

    products = result["items"]

    # Conversion des modèles SQLAlchemy en schémas Pydantic
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


# Décision métier : Escalade humaine
def should_escalate(
    intent_analysis: IntentAnalysis
) -> bool:

    # Une demande humaine explicite est toujours prioritaire
    if intent_analysis.intent == CustomerIntent.HUMAN_REQUEST:
        return True

    # Le backend décide en fonction de la recommandation de Gemini
    if intent_analysis.escalation_recommended:
        return True

    return False


# Création d'une notification
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

    # Priorité définie par le backend
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


# Phase B : Génération de la réponse
async def generate_customer_response(
    client: genai.Client,
    customer_message: str,
    intent_analysis: IntentAnalysis,
    products: list[ProductContext]
) -> str:

    # Préparation des données fiables issues de PostgreSQL
    product_data = [
        product.model_dump(mode="json")
        for product in products
    ]

    context = {
        "customer_message": customer_message,
        "intent_analysis": intent_analysis.model_dump(mode="json"),
        "products_from_database": product_data
    }

    response = await client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=(
            "Voici le contexte de la conversation et "
            "les données commerciales disponibles.\n\n"
            + json.dumps(
                context,
                ensure_ascii=False,
                indent=2
            )
        ),
        config=types.GenerateContentConfig(
            system_instruction=CUSTOMER_RESPONSE_PROMPT,
            temperature=0.4
        )
    )

    content = response.text

    if not content:
        raise ValueError(
            "Gemini returned an empty customer response."
        )

    return content.strip()


# Orchestrateur principal
async def process_customer_message(
    db: Session,
    client: genai.Client,
    customer_message: str,
    customer_phone: str,
    customer_name: str | None = None
) -> ChatbotResponse:

    # 1. ANALYSE DE L'INTENTION
    intent_analysis = await analyze_customer_intent(
        client=client,
        customer_message=customer_message
    )

    # 2. VERIFICATION DE L'ESCALADE
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

    # 3. RECHERCHE DES PRODUITS
    products = search_relevant_products(
        db=db,
        intent_analysis=intent_analysis
    )

    # 4. GENERATION DE LA REPONSE
    customer_response = await generate_customer_response(
        client=client,
        customer_message=customer_message,
        intent_analysis=intent_analysis,
        products=products
    )

    # 5. RETOUR DU RESULTAT
    return ChatbotResponse(
        message=customer_response,
        escalated=False,
        escalation_reason=None,
        intent=intent_analysis.intent
    )
