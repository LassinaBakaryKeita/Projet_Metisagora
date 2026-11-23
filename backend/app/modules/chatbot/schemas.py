from enum import Enum
from typing import Optional, Literal
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class CustomerIntent(str, Enum):
    PRODUCT_SEARCH = "product_search"
    PRODUCT_LIST = "product_list"
    PRODUCT_DETAILS = "product_details"
    PRICE_INQUIRY = "price_inquiry"
    STOCK_INQUIRY = "stock_inquiry"
    AVAILABILITY_SEARCH = "availability_search"
    MOST_EXPENSIVE = "most_expensive"
    CHEAPEST = "cheapest"
    PRODUCT_COMPARISON = "product_comparison"
    PRODUCT_RECOMMENDATION = "product_recommendation"

    GENERAL_QUESTION = "general_question"
    HUMAN_REQUEST = "human_request"
    COMPLAINT = "complaint"
    ORDER_ISSUE = "order_issue"
    OUT_OF_SCOPE = "out_of_scope"
    UNCLEAR = "unclear"


class IntentAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    intent: CustomerIntent

    product_name: Optional[str] = None

    product_names: list[str] = Field(default_factory=list)

    search_query: Optional[str] = None

    requested_information: list[str] = Field(
        default_factory=list
    )

    stock_filter: Literal[
        "all",
        "in_stock",
        "out_of_stock"
    ] = "all"

    needs_clarification: bool = False

    clarification_question: Optional[str] = None

    escalation_recommended: bool = False

    escalation_reason: Optional[str] = None


class ProductContext(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int


class EscalationContext(BaseModel):
    customer_phone: str
    customer_name: Optional[str] = None
    message: str
    reason: str
    priority: str = "medium"


class ChatbotResponse(BaseModel):
    message: str
    escalated: bool = False
    escalation_reason: Optional[str] = None
    intent: Optional[CustomerIntent] = None