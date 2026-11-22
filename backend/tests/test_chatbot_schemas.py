
from app.modules.chatbot.schemas import (
    CustomerIntent,
    IntentAnalysis,
    ChatbotResponse,
)


def test_intent_analysis():

    analysis = IntentAnalysis(
        intent=CustomerIntent.PRICE_INQUIRY,
        product_name="Nike Air Max",
        requested_information=["price"],
    )

    assert analysis.intent == CustomerIntent.PRICE_INQUIRY
    assert analysis.product_name == "Nike Air Max"
    assert analysis.needs_clarification is False

    print("IntentAnalysis : OK")


def test_chatbot_response():

    response = ChatbotResponse(
        message="Bonjour ! Ce produit coûte 500 MAD.",
        intent=CustomerIntent.PRICE_INQUIRY,
    )

    assert response.escalated is False
    assert response.intent == CustomerIntent.PRICE_INQUIRY

    print("ChatbotResponse : OK")


if __name__ == "__main__":

    test_intent_analysis()
    test_chatbot_response()

    print("\nTous les tests sont réussis !")
