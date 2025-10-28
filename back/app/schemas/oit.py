from datetime import datetime
from pydantic import BaseModel
from typing import Literal, List, Optional

class OitStatus(BaseModel):
    status: Literal["alerta", "error", "check"]
    summary: str
    alerts: List[str] = []
    missing: List[str] = []
    evidence: List[str] = []

class OitDocumentOut(BaseModel):
    id: int
    filename: str
    original_name: Optional[str] = None
    status: str
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True