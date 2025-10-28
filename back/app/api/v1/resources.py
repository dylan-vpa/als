from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db
from ...models.resource import Resource
from ...schemas.resource import ResourceCreate, ResourceOut, ResourceUpdate
from ...core.dependencies import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/", response_model=List[ResourceOut])
def list_resources(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Resource).order_by(Resource.created_at.desc()).all()

@router.post("/", response_model=ResourceOut)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = Resource(
        name=payload.name,
        type=payload.type,
        quantity=payload.quantity,
        available=payload.available,
        location=payload.location,
        description=payload.description,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{resource_id}", response_model=ResourceOut)
def update_resource(resource_id: int, payload: ResourceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(Resource).filter(Resource.id == resource_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    if payload.name is not None:
        item.name = payload.name
    if payload.type is not None:
        item.type = payload.type
    if payload.quantity is not None:
        item.quantity = payload.quantity
    if payload.available is not None:
        item.available = payload.available
    if payload.location is not None:
        item.location = payload.location
    if payload.description is not None:
        item.description = payload.description
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(Resource).filter(Resource.id == resource_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}