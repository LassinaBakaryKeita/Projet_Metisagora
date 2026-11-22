
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict



# 1. INTENTIONS POSSIBLES DU CLIENT
class CustomerIntent(str, Enum):
    PRODUCT_SEARCH = "product_search"
    PRICE_INQUIRY = "price_inquiry"
    STOCK_INQUIRY = "stock_inquiry"
    GENERAL_QUESTION = "general_question"
    HUMAN_REQUEST = "human_request"
    OUT_OF_SCOPE = "out_of_scope"
    UNCLEAR = "unclear"


# 2. ANALYSE DE L'INTENTION
class IntentAnalysis(BaseModel):

    model_config = ConfigDict(extra="forbid")

    intent: CustomerIntent

    product_name: Optional[str] = None

    requested_information: list[str] = Field(
        default_factory=list
    )

    needs_clarification: bool = False

    escalation_recommended: bool = False

    escalation_reason: Optional[str] = None


# 3. CONTEXTE DES PRODUITS
class ProductContext(BaseModel):

    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock: int


# 4. CONTEXTE D'UNE ESCALADE HUMAINE
class EscalationContext(BaseModel):

    customer_phone: str
    customer_name: Optional[str] = None

    message: str

    reason: str

    priority: str = "medium"


# 5. REPONSE FINALE DU CHATBOT
class ChatbotResponse(BaseModel):

    message: str

    escalated: bool = False

    escalation_reason: Optional[str] = None

    intent: Optional[CustomerIntent] = None
