
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate


def create_notification(
    db: Session,
    notification_data: NotificationCreate
) -> Notification:

    notification = Notification(
        **notification_data.model_dump()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def get_notifications(db: Session) -> list[Notification]:

    statement = (
        select(Notification)
        .order_by(Notification.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_notification_by_id(
    db: Session,
    notification_id: int
) -> Notification | None:

    return db.get(Notification, notification_id)


def get_unresolved_count(db: Session) -> int:

    statement = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.status == "pending")
    )

    return db.scalar(statement) or 0


def get_unread_count(db: Session) -> int:

    statement = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.is_read.is_(False))
    )

    return db.scalar(statement) or 0


def mark_notification_as_read(
    db: Session,
    notification_id: int
) -> Notification | None:

    notification = get_notification_by_id(db, notification_id)

    if notification is None:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def resolve_notification(
    db: Session,
    notification_id: int
) -> Notification | None:

    notification = get_notification_by_id(db, notification_id)

    if notification is None:
        return None

    notification.status = "resolved"
    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def reopen_notification(
    db: Session,
    notification_id: int
) -> Notification | None:

    notification = get_notification_by_id(db, notification_id)

    if notification is None:
        return None

    notification.status = "pending"

    db.commit()
    db.refresh(notification)

    return notification
