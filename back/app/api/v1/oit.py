from fastapi import APIRouter, Depends, HTTPException, Body
# Import condicional de soporte multipart
try:
    import multipart  # type: ignore
    MULTIPART_AVAILABLE = True
except Exception:
    MULTIPART_AVAILABLE = False

from sqlalchemy.orm import Session
from pathlib import Path
import uuid
import json
import logging

from ...database import get_db
from ...core.dependencies import get_current_user
from ...models.system_user import SystemUser
from ...models.oit_document import OitDocument
from ...schemas.oit import OitDocumentOut
from ...services.ai import OitAiService, extract_text, load_reference_text
from fastapi.responses import StreamingResponse

# Import sólo si multipart está disponible, para evitar RuntimeError de FastAPI
if MULTIPART_AVAILABLE:
    from fastapi import UploadFile, File

router = APIRouter(tags=["oit"])
logger = logging.getLogger("oit.api")

# Directorio base del backend (../..../back)
BACK_DIR = Path(__file__).resolve().parents[3]
UPLOADS_DIR = BACK_DIR / "uploads" / "oit"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

if MULTIPART_AVAILABLE:
    @router.post("/oit/upload", response_model=OitDocumentOut)
    async def upload_oit(
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: SystemUser = Depends(get_current_user),
    ):
        # Guardar archivo con nombre único
        ext = Path(file.filename).suffix
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOADS_DIR / safe_name
        content = await file.read()
        dest.write_bytes(content)
        logger.info(f"Subida OIT por usuario={getattr(current_user, 'id', 'anon')}: original={file.filename} -> {dest}")

        # Extraer texto
        doc_text = extract_text(dest)
        logger.info(f"Extraído texto OIT: longitud={len(doc_text)}")
        if not doc_text:
            raise HTTPException(status_code=400, detail="No se pudo leer el documento o está vacío")

        # Cargar referencias
        ref_text = load_reference_text()
        logger.info(f"Referencias cargadas: longitud={len(ref_text)}")

        # Analizar con IA (Ollama / fallback)
        ai = OitAiService()
        logger.info("Iniciando análisis IA (si modelo no disponible, se usará fallback)")
        result = ai.analyze(doc_text, ref_text)

        status = result.get("status", "error")
        summary = result.get("summary")
        alerts = result.get("alerts", [])
        missing = result.get("missing", [])
        evidence = result.get("evidence", [])
        logger.info(f"Resultado IA: status={status}, alerts={len(alerts)}, missing={len(missing)}, evidence={len(evidence)}")

        # Guardar en BD (ruta relativa a back/)
        doc = OitDocument(
            filename=str(dest.relative_to(BACK_DIR)),  # uploads/oit/<archivo>
            original_name=file.filename,
            status=status,
            summary=summary,
            alerts=json.dumps(alerts, ensure_ascii=False),
            missing=json.dumps(missing, ensure_ascii=False),
            evidence=json.dumps(evidence, ensure_ascii=False),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Documento OIT persistido id={doc.id}")

        return OitDocumentOut.model_validate(doc)
else:
    # Endpoint alternativo para pruebas sin python-multipart instalado
    @router.post("/oit/upload-raw", response_model=OitDocumentOut)
    def upload_oit_raw(
        text: str = Body(..., embed=True),
        db: Session = Depends(get_db),
        current_user: SystemUser = Depends(get_current_user),
    ):
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Texto vacío")
        # Guardar como archivo .txt para trazabilidad
        safe_name = f"{uuid.uuid4().hex}.txt"
        dest = UPLOADS_DIR / safe_name
        dest.write_text(text, encoding="utf-8")
        logger.info(f"Subida RAW OIT por usuario={getattr(current_user, 'id', 'anon')}: -> {dest}")

        doc_text = text.strip()
        ref_text = load_reference_text()
        ai = OitAiService()
        logger.info("Iniciando análisis IA (RAW, fallback si es necesario)")
        result = ai.analyze(doc_text, ref_text)

        status = result.get("status", "error")
        summary = result.get("summary")
        alerts = result.get("alerts", [])
        missing = result.get("missing", [])
        evidence = result.get("evidence", [])
        logger.info(f"Resultado IA RAW: status={status}, alerts={len(alerts)}, missing={len(missing)}, evidence={len(evidence)}")

        doc = OitDocument(
            filename=str(dest.relative_to(BACK_DIR)),
            original_name="raw.txt",
            status=status,
            summary=summary,
            alerts=json.dumps(alerts, ensure_ascii=False),
            missing=json.dumps(missing, ensure_ascii=False),
            evidence=json.dumps(evidence, ensure_ascii=False),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Documento OIT RAW persistido id={doc.id}")

        return OitDocumentOut.model_validate(doc)

@router.get("/oit/{doc_id}", response_model=OitDocumentOut)
def get_oit(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return OitDocumentOut.model_validate(doc)

@router.get("/oit", response_model=list[OitDocumentOut])
def list_oit(db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    docs = db.query(OitDocument).order_by(OitDocument.created_at.desc()).limit(50).all()

    if not docs:
        sample_file = UPLOADS_DIR / "b49b86912461425d8ec5818b5bb34122.txt"
        if sample_file.exists():
            existing = db.query(OitDocument).filter(OitDocument.filename == str(sample_file.relative_to(BACK_DIR))).first()
            if not existing:
                doc = OitDocument(
                    filename=str(sample_file.relative_to(BACK_DIR)),
                    original_name="OIT-001.txt",
                    status="check",
                    summary="OIT de ejemplo cargada automáticamente.",
                    alerts=json.dumps([]),
                    missing=json.dumps([]),
                    evidence=json.dumps([]),
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)
                docs = [doc]
            else:
                docs = [existing]

    return [OitDocumentOut.model_validate(d) for d in docs]

@router.get("/oit/{doc_id}/recommendations")
def oit_recommendations(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    # Cargar texto del documento
    file_path = BACK_DIR / doc.filename
    text = ""
    try:
        text = extract_text(file_path)
    except Exception:
        text = ""
    ai = OitAiService()
    recs = ai.recommend_resources(text)
    # Intentar cruzar con recursos disponibles en BD por tipo
    try:
        from ...models.resource import Resource
        matches = {}
        for r in recs:
            type_ = r.get("type")
            items = db.query(Resource).filter(Resource.type == type_).all()
            matches[type_] = [
                {
                    "id": it.id,
                    "name": it.name,
                    "type": it.type,
                    "available": it.available,
                    "quantity": it.quantity,
                    "location": it.location,
                }
                for it in items
            ]
    except Exception:
        matches = {}
    return {"recommendations": recs, "matches": matches}

@router.post("/oit/{doc_id}/final-report")
def generate_final_report(
    doc_id: int,
    sampling: dict = Body(..., description="Datos del formulario de muestreo"),
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """Genera un informe final (texto plano) y lo devuelve como descarga."""
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Construir texto básico de informe; en el futuro se puede invocar IA
    lines = []
    lines.append(f"INFORME FINAL OIT #{doc.id}")
    lines.append("")
    lines.append(f"Documento: {doc.original_name or doc.filename}")
    lines.append(f"Estado: {doc.status}")
    lines.append(f"Fecha de carga: {doc.created_at}")
    lines.append("")
    lines.append("Resumen:")
    lines.append(doc.summary or "(sin resumen)")
    lines.append("")
    lines.append("Datos de Muestreo:")
    for k, v in (sampling or {}).items():
        lines.append(f"- {k}: {v}")
    content = "\n".join(lines)

    def _iter():
        yield content

    filename = f"informe_final_{doc_id}.txt"
    headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
    return StreamingResponse(_iter(), media_type="text/plain", headers=headers)