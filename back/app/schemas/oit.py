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
    alerts: List[str] = []
    missing: List[str] = []
    evidence: List[str] = []
    reference_bundle_path: Optional[str] = None
    reference_bundle_available: bool = False
    can_recommend: bool = False
    compliance_bundle_path: Optional[str] = None
    compliance_report_path: Optional[str] = None
    can_sample: bool = False
    pending_gap_count: int = 0
    approval_status: str
    approved_schedule_date: Optional[datetime] = None
    resource_plan: Optional[dict] = None
    resource_gaps: Optional[dict] = None
    approval_notes: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True