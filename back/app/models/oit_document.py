from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
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
    created_at = Column(DateTime, default=datetime.utcnow)