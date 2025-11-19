from typing import List
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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

@router.post("/upload-csv")
def upload_resources_csv(file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV")
    
    try:
        content = file.file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        created_resources = []
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validar y procesar cada fila
                name = row.get('name', '').strip()
                if not name:
                    errors.append(f"Fila {row_num}: Nombre requerido")
                    continue
                
                resource_type = row.get('type', 'equipo').strip().lower()
                if resource_type not in ['vehiculo', 'equipo', 'personal', 'insumo']:
                    errors.append(f"Fila {row_num}: Tipo inválido. Use: vehiculo, equipo, personal, insumo")
                    continue
                
                try:
                    quantity = int(row.get('quantity', '1').strip())
                    if quantity <= 0:
                        raise ValueError("Cantidad debe ser positiva")
                except ValueError:
                    errors.append(f"Fila {row_num}: Cantidad inválida")
                    continue
                
                available = row.get('available', 'yes').strip().lower() in ['yes', 'si', 'true', '1']
                location = row.get('location', '').strip() or None
                description = row.get('description', '').strip() or None
                
                # Crear recurso
                resource = Resource(
                    name=name,
                    type=resource_type,
                    quantity=quantity,
                    available=available,
                    location=location,
                    description=description
                )
                db.add(resource)
                created_resources.append(resource)
                
            except Exception as e:
                errors.append(f"Fila {row_num}: Error procesando fila - {str(e)}")
        
        if created_resources:
            db.commit()
            for resource in created_resources:
                db.refresh(resource)
        
        return {
            "created": len(created_resources),
            "errors": errors,
            "resources": created_resources
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error procesando archivo CSV: {str(e)}")
    finally:
        file.file.close()
