
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_admin

from app.modules.notifications import service
from app.modules.notifications.schemas import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    dependencies=[Depends(get_current_admin)]
)


@router.post(
    "/",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db)
):
    return service.create_notification(db, notification_data)


@router.get(
    "/",
    response_model=NotificationListResponse
)
def get_notifications(
    db: Session = Depends(get_db)
):
    notifications = service.get_notifications(db)

    return {
        "items": notifications,
        "total": len(notifications)
    }


@router.get("/unresolved-count")
def get_unresolved_count(
    db: Session = Depends(get_db)
):
    count = service.get_unresolved_count(db)

    return {"count": count}


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db)
):
    count = service.get_unread_count(db)

    return {"count": count}


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = service.mark_notification_as_read(
        db,
        notification_id
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.patch(
    "/{notification_id}/resolve",
    response_model=NotificationResponse
)
def resolve_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = service.resolve_notification(
        db,
        notification_id
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.patch(
    "/{notification_id}/reopen",
    response_model=NotificationResponse
)
def reopen_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = service.reopen_notification(
        db,
        notification_id
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification
