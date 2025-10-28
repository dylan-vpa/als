from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ResourceBase(BaseModel):
    name: str
    type: str = Field(description="Tipo de recurso: vehiculo|equipo|personal|insumo")
    quantity: int = 1
    available: bool = True
    location: Optional[str] = None
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[int] = None
    available: Optional[bool] = None
    location: Optional[str] = None
    description: Optional[str] = None

class ResourceOut(ResourceBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True