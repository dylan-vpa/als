from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...core.dependencies import get_current_user
from ...database import get_db
from ...models.system_user import SystemUser
from ...services.notifications import (
    list_notifications_for_user,
    mark_notifications_read,
    serialize_notification,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    document_id: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        allow_population_by_field_name = True


class NotificationsResponse(BaseModel):
    items: List[NotificationOut]


class NotificationsMarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = Field(default=None, description="IDs a marcar como leídos. Si no se envía, marca todos")


class NotificationsMarkReadResponse(BaseModel):
    updated: int


@router.get("", response_model=NotificationsResponse)
def list_notifications(
    *,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
) -> NotificationsResponse:
    notifications = list_notifications_for_user(db, current_user.id, limit=limit)
    items = [NotificationOut.model_validate(serialize_notification(n)) for n in notifications]
    return NotificationsResponse(items=items)


@router.post("/mark-read", response_model=NotificationsMarkReadResponse)
def mark_read(
    payload: NotificationsMarkReadRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
) -> NotificationsMarkReadResponse:
    updated = mark_notifications_read(db, current_user.id, payload.notification_ids)
    return NotificationsMarkReadResponse(updated=updated)
