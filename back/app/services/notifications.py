import json
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from ..models.notification import Notification


def _serialize_payload(payload: Optional[Dict[str, Any]]) -> Optional[str]:
    if payload is None:
        return None
    try:
        return json.dumps(payload, ensure_ascii=False)
    except Exception:
        return None


def deserialize_payload(raw: Optional[str]) -> Optional[Dict[str, Any]]:
    if not raw:
        return None
    try:
        value = json.loads(raw)
        if isinstance(value, dict):
            return value
    except Exception:
        pass
    return None


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    document_id: Optional[int] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        document_id=document_id,
        type=type,
        title=title,
        message=message,
        payload=_serialize_payload(payload),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications_for_user(db: Session, user_id: int, limit: int = 50) -> List[Notification]:
    query = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    if limit:
        query = query.limit(limit)
    return query.all()


def mark_notifications_read(db: Session, user_id: int, notification_ids: Optional[Iterable[int]] = None) -> int:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if notification_ids:
        ids = list(notification_ids)
        if not ids:
            return 0
        query = query.filter(Notification.id.in_(ids))
    updated = query.filter(Notification.read_at.is_(None)).update(
        {Notification.read_at: datetime.utcnow()}, synchronize_session=False
    )
    db.commit()
    return updated or 0


def serialize_notification(notification: Notification) -> Dict[str, Any]:
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "document_id": notification.document_id,
        "payload": deserialize_payload(notification.payload),
        "read_at": notification.read_at,
        "created_at": notification.created_at,
    }
