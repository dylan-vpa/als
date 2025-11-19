from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from ..database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # vehiculo|equipo|personal|insumo
    quantity = Column(Integer, nullable=False, default=1)
    available = Column(Boolean, nullable=False, default=True)
    status = Column(String, nullable=True, default="available")  # available, maintenance, etc.
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    bookings = relationship("ResourceBooking", back_populates="resource")