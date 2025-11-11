from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class OitDocument(Base):
    __tablename__ = "oit_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)  # ruta relativa donde se guarda
    original_name = Column(String, nullable=True)
    status = Column(String, nullable=False, default="check")  # alerta|error|check
    summary = Column(Text, nullable=True)
    alerts = Column(Text, nullable=True)   # JSON string
    missing = Column(Text, nullable=True)  # JSON string
    evidence = Column(Text, nullable=True) # JSON string
    compliance_bundle_path = Column(String, nullable=True)
    compliance_report_path = Column(String, nullable=True)
    approval_status = Column(String, nullable=False, default="pending")
    approved_schedule_date = Column(DateTime, nullable=True)
    resource_plan = Column(Text, nullable=True)
    resource_gaps = Column(Text, nullable=True)
    approval_notes = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("system_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("SystemUser", backref="oit_documents")