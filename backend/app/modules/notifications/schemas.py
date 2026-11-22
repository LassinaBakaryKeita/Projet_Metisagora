
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Valeurs autorisées
NotificationStatus = Literal["pending", "resolved"]
NotificationPriority = Literal["low", "medium", "high"]


class NotificationCreate(BaseModel):
    customer_phone: str = Field(min_length=1, max_length=20)
    customer_name: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=1)
    reason: str = Field(min_length=1, max_length=255)
    priority: NotificationPriority = "medium"


class NotificationResponse(BaseModel):
    id: int
    customer_phone: str
    customer_name: str | None
    message: str
    reason: str
    status: NotificationStatus
    is_read: bool
    priority: NotificationPriority
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
