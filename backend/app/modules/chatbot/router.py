
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from google import genai

from app.database.connection import get_db
from app.modules.chatbot.schemas import ChatbotResponse
from app.modules.chatbot.service import process_customer_message


router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatbotTestRequest(BaseModel):
    customer_phone: str = Field(min_length=1, max_length=20)
    customer_name: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=1, max_length=2000)


@router.post("/test", response_model=ChatbotResponse)
async def test_chatbot(
    payload: ChatbotTestRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client: genai.Client = request.app.state.gemini_client

    result = await process_customer_message(
        db=db,
        client=client,
        customer_message=payload.message,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name
    )

    return result
