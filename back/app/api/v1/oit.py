from fastapi import APIRouter, Depends, HTTPException, Body
# Import condicional de soporte multipart
try:
    import multipart  # type: ignore
    MULTIPART_AVAILABLE = True
except Exception:
    MULTIPART_AVAILABLE = False

from sqlalchemy.orm import Session
from sqlalchemy import func
from pathlib import Path
from datetime import datetime
import uuid
import json
import logging

from ...database import get_db
from ...core.dependencies import get_current_user
from ...models.system_user import SystemUser
from ...models.oit_document import OitDocument
from ...models.resource import Resource
from ...models.resource_booking import ResourceBooking
from ...schemas.oit import OitDocumentOut
from ...services.ai import OitAiService, extract_text, load_reference_text
from ...services.notifications import create_notification
from ...services.compliance import evaluate_compliance
from fastapi.responses import StreamingResponse, FileResponse, Response
from pydantic import BaseModel, Field
from typing import Any, Dict, List
from ...services.notifications import create_notification

router = APIRouter(tags=["oit"])

# Import sólo si multipart está disponible, para evitar RuntimeError de FastAPI
if MULTIPART_AVAILABLE:
    from fastapi import UploadFile, File

@router.get("/oit/{doc_id}/sampling/schema", response_model=Dict)
def get_sampling_schema(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    # Intentar generar esquema con IA; fallback estático
    schema: Dict[str, Any] = {
        "title": f"Formulario de muestreo OIT #{doc.id}",
        "sections": [
            {
                "key": "general",
                "label": "Datos generales",
                "fields": [
                    {"key": "fecha_inicio", "label": "Fecha de inicio", "type": "date"},
                    {"key": "ubicacion", "label": "Ubicación", "type": "text"},
                    {"key": "responsable", "label": "Responsable", "type": "text"},
                ]
            },
            {
                "key": "mediciones",
                "label": "Mediciones",
                "fields": [
                    {"key": "ph_agua", "label": "pH del agua", "type": "number"},
                    {"key": "turbidez", "label": "Turbidez (NTU)", "type": "number"},
                    {"key": "observaciones", "label": "Observaciones", "type": "textarea"},
                ]
            }
        ]
    }
    try:
        ai = OitAiService()
        file_path = BACK_DIR / doc.filename
        text = extract_text(file_path)
        prompt = "Genera un esquema JSON para formulario de muestreo con secciones y campos (key,label,type)."
        result = ai.chat(message=prompt, system_prompt=text)
        maybe = result.get("reply")
        data = json.loads(maybe)
        if isinstance(data, dict) and data.get("sections"):
            schema = data
    except Exception:
        pass
    return schema
logger = logging.getLogger("oit.api")

# Directorio base del backend (../..../back)
BACK_DIR = Path(__file__).resolve().parents[3]
UPLOADS_DIR = BACK_DIR / "uploads" / "oit"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
REVIEWS_DIR = UPLOADS_DIR / "reviews"
REVIEWS_DIR.mkdir(parents=True, exist_ok=True)
ANALYSIS_DIR = UPLOADS_DIR / "analysis"
ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)


def _parse_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        data = json.loads(value)
        if isinstance(data, list):
            return [str(item) for item in data]
    except Exception:
        return []
    return []


def _extract_gap_items(resource_gaps: Any) -> list[Dict[str, Any]]:
    if isinstance(resource_gaps, dict):
        items = resource_gaps.get("items")
        if isinstance(items, list):
            return items
    elif isinstance(resource_gaps, list):
        return resource_gaps
    return []


def _bundle_path_for(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return REVIEWS_DIR / f"{name}_bundle.md"


def _report_path_for(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return REVIEWS_DIR / f"{name}_report.json"

def _sampling_meta_path(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return REVIEWS_DIR / f"{name}_sampling_meta.json"

def _sampling_export_path(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return REVIEWS_DIR / f"{name}_sampling_export.txt"

def _analysis_path_for(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return ANALYSIS_DIR / f"{name}_analysis.txt"

def _analysis_file_path_for(doc: OitDocument) -> Path:
    name = Path(doc.filename).stem
    return ANALYSIS_DIR / f"{name}_analysis.pdf"


def _serialize_doc(doc: OitDocument) -> OitDocumentOut:
    alerts = _parse_list(doc.alerts)
    missing = _parse_list(doc.missing)
    evidence = _parse_list(doc.evidence)
    resource_plan = None
    resource_gaps = None
    try:
        resource_plan = json.loads(doc.resource_plan) if doc.resource_plan else None
    except Exception:
        resource_plan = None
    try:
        resource_gaps = json.loads(doc.resource_gaps) if doc.resource_gaps else None
    except Exception:
        resource_gaps = None

    reference_bundle_path = doc.compliance_bundle_path
    if not reference_bundle_path:
        bundle = _bundle_path_for(doc)
        if bundle.exists():
            reference_bundle_path = str(bundle.relative_to(BACK_DIR))

    gap_items = _extract_gap_items(resource_gaps)
    pending_gap_count = sum(1 for gap in gap_items if (gap or {}).get("quantity", 0) > 0)

    # Determinar si se puede muestrear:
    # - Debe estar aprobado
    # - No deben existir recursos faltantes
    # - Si hay fecha programada aprobada, debe haberse alcanzado (now >= approved_schedule_date)
    now = datetime.utcnow()
    approved_time_ok = True
    try:
        if doc.approved_schedule_date is not None:
            approved_time_ok = now >= doc.approved_schedule_date
    except Exception:
        approved_time_ok = True

    data = {
        "id": doc.id,
        "filename": doc.filename,
        "original_name": doc.original_name,
        "status": doc.status,
        "summary": doc.summary,
        "alerts": alerts,
        "missing": missing,
        "evidence": evidence,
        "reference_bundle_path": reference_bundle_path,
        "reference_bundle_available": reference_bundle_path is not None,
        "can_recommend": doc.status == "check" and not alerts and not missing,
        "compliance_bundle_path": doc.compliance_bundle_path,
        "compliance_report_path": doc.compliance_report_path,
        "can_sample": (doc.approval_status == "approved" and pending_gap_count == 0 and approved_time_ok),
        "pending_gap_count": pending_gap_count,
        "approval_status": doc.approval_status,
        "approved_schedule_date": doc.approved_schedule_date,
        "resource_plan": resource_plan,
        "resource_gaps": resource_gaps,
        "approval_notes": doc.approval_notes,
        "review_notes": doc.review_notes,
        "created_at": doc.created_at,
    }
    return OitDocumentOut.model_validate(data)


class ResourceRequest(BaseModel):
    type: str
    name: str | None = None
    quantity: int = Field(default=1, ge=1)


class PlanRequest(BaseModel):
    scheduled_datetime: datetime | None = None
    notes: str | None = None
    requested_resources: List[ResourceRequest] = Field(default_factory=list)


class PlanConfirmRequest(BaseModel):
    approved: bool
    scheduled_datetime: datetime | None = None
    notes: str | None = None
    plan: Dict[str, Any] | None = None
    gaps: Dict[str, Any] | None = None

class SamplingCompleteRequest(BaseModel):
    sampling: Dict[str, Any]
    download_time: datetime | None = None

class SamplingStatus(BaseModel):
    completed_at: datetime | None = None
    download_scheduled_at: datetime | None = None
    export_available: bool = False
    analysis_uploaded_at: datetime | None = None
    final_report_allowed: bool = False

def _read_sampling_status(doc: OitDocument) -> SamplingStatus:
    meta_path = _sampling_meta_path(doc)
    status = SamplingStatus()
    if meta_path.exists():
        try:
            data = json.loads(meta_path.read_text(encoding="utf-8"))
            status.completed_at = (datetime.fromisoformat(data.get("completed_at")) if data.get("completed_at") else None)
            status.download_scheduled_at = (datetime.fromisoformat(data.get("download_scheduled_at")) if data.get("download_scheduled_at") else None)
            status.analysis_uploaded_at = (datetime.fromisoformat(data.get("analysis_uploaded_at")) if data.get("analysis_uploaded_at") else None)
        except Exception:
            pass
    export_path = _sampling_export_path(doc)
    # export disponible sólo si existe y ya se alcanzó la hora programada
    now = datetime.utcnow()
    scheduled_ok = not status.download_scheduled_at or now >= status.download_scheduled_at
    status.export_available = export_path.exists() and scheduled_ok
    status.final_report_allowed = status.analysis_uploaded_at is not None
    return status

@router.post("/oit/{doc_id}/sampling/complete")
def sampling_complete(
    doc_id: int,
    payload: SamplingCompleteRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Guardar export del muestreo como texto plano
    export_path = _sampling_export_path(doc)
    lines = ["MUESTREO COMPLETADO", f"OIT #{doc.id}", "", "Datos de Muestreo:"]
    for k, v in (payload.sampling or {}).items():
        lines.append(f"- {k}: {v}")
    try:
        export_path.write_text("\n".join(lines), encoding="utf-8")
    except Exception as exc:
        logger.warning(f"No se pudo escribir export de muestreo: {exc}")

    # Guardar metadatos (completado y horario de descarga)
    meta_path = _sampling_meta_path(doc)
    started_at_str = None
    try:
        started_at_raw = (payload.sampling or {}).get("fecha_inicio")
        if isinstance(started_at_raw, str) and started_at_raw:
            # fecha_inicio es YYYY-MM-DD; agregar hora por defecto si no viene
            started_at_str = f"{started_at_raw}T09:00"
    except Exception:
        started_at_str = None

    meta = {
        "completed_at": datetime.utcnow().isoformat(),
        "started_at": started_at_str,
        "download_scheduled_at": (payload.download_time.isoformat() if payload.download_time else None),
        "analysis_uploaded_at": None,
    }
    try:
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning(f"No se pudo escribir metadatos de muestreo: {exc}")

    # Notificaciones de horario
    try:
        from ...services.notifications import create_notification
        scheduled = doc.approved_schedule_date
        if scheduled:
            # Comparar inicio respecto a programado
            if started_at_str:
                try:
                    started_dt = datetime.fromisoformat(started_at_str)
                    if started_dt < scheduled:
                        create_notification(
                            db,
                            user_id=current_user.id,
                            type="sampling.started_early",
                            title="Muestreo iniciado antes de lo programado",
                            message=f"La OIT #{doc.id} inició muestreo a las {started_dt.isoformat()} (programado {scheduled.isoformat()}).",
                            document_id=doc.id,
                            payload={"scheduled": scheduled.isoformat(), "started": started_dt.isoformat()},
                        )
                    elif started_dt > scheduled:
                        create_notification(
                            db,
                            user_id=current_user.id,
                            type="sampling.started_late",
                            title="Muestreo iniciado después de lo programado",
                            message=f"La OIT #{doc.id} inició muestreo a las {started_dt.isoformat()} (programado {scheduled.isoformat()}).",
                            document_id=doc.id,
                            payload={"scheduled": scheduled.isoformat(), "started": started_dt.isoformat()},
                        )
                except Exception:
                    pass
    except Exception:
        pass

    return _read_sampling_status(doc).model_dump()

@router.get("/oit/{doc_id}/sampling/status", response_model=SamplingStatus)
def get_sampling_status(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return _read_sampling_status(doc)

@router.get("/oit/{doc_id}/sampling/export")
def download_sampling_export(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    status = _read_sampling_status(doc)
    if not status.export_available:
        raise HTTPException(status_code=403, detail="Export de muestreo aún no disponible")
    path = _sampling_export_path(doc)
    return FileResponse(path, media_type="text/plain", filename=path.name)

if MULTIPART_AVAILABLE:
    @router.post("/oit/{doc_id}/analysis/upload")
    async def upload_analysis_file(
        doc_id: int,
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: SystemUser = Depends(get_current_user),
    ):
        doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="Archivo de análisis requerido")
        content_type = (file.content_type or "").lower()
        if "pdf" not in content_type and not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Sólo se aceptan archivos PDF para el análisis")

        dest = _analysis_file_path_for(doc)
        try:
            content = await file.read()
            dest.write_bytes(content)
        except Exception as exc:
            logger.warning(f"No se pudo guardar PDF de análisis: {exc}")
            raise HTTPException(status_code=500, detail="No se pudo guardar el archivo de análisis")

        # Intentar extraer texto del PDF para incluir en el informe final
        txt_path = _analysis_path_for(doc)
        try:
            extracted = extract_text(dest)
            txt_path.write_text(extracted or "", encoding="utf-8")
        except Exception:
            # Si falla extracción, continuar con PDF solo
            pass

        # Actualizar metadatos de muestreo
        meta_path = _sampling_meta_path(doc)
        meta = {}
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                meta = {}
        meta["analysis_uploaded_at"] = datetime.utcnow().isoformat()
        try:
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

        return _read_sampling_status(doc).model_dump()
else:
    @router.post("/oit/{doc_id}/analysis/upload")
    def upload_analysis(
        doc_id: int,
        text: str = Body(..., embed=True, description="Texto del análisis realizado"),
        db: Session = Depends(get_db),
        current_user: SystemUser = Depends(get_current_user),
    ):
        doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Texto de análisis vacío")

        analysis_path = _analysis_path_for(doc)
        try:
            analysis_path.write_text(text.strip(), encoding="utf-8")
        except Exception as exc:
            logger.warning(f"No se pudo escribir análisis: {exc}")
            raise HTTPException(status_code=500, detail="No se pudo guardar el análisis")

        # Actualizar metadatos de muestreo
        meta_path = _sampling_meta_path(doc)
        meta = {}
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                meta = {}
        meta["analysis_uploaded_at"] = datetime.utcnow().isoformat()
        try:
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

        return _read_sampling_status(doc).model_dump()


def _overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return not (a_end <= b_start or b_end <= a_start)

def _default_slot(dt: datetime | None) -> tuple[datetime | None, datetime | None]:
    if not dt:
        return None, None
    # Slot de 2 horas por defecto
    return dt, dt.replace(hour=dt.hour + 2)

def _build_plan(doc: OitDocument, plan_request: PlanRequest, db: Session) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
    assignments: List[Dict[str, Any]] = []
    gaps: List[Dict[str, Any]] = []

    for req in plan_request.requested_resources:
        remaining = req.quantity or 1
        query = db.query(Resource).filter(func.lower(Resource.type) == req.type.lower())
        if req.name:
            query = query.filter(func.lower(Resource.name) == req.name.lower())
        resources = query.order_by(Resource.available.desc(), Resource.quantity.desc()).all()

        matches: List[Dict[str, Any]] = []
        start_dt, end_dt = _default_slot(plan_request.scheduled_datetime)
        for resource in resources:
            available_qty = resource.quantity if resource.available else 0
            if available_qty <= 0:
                continue
            if resource.status == "maintenance":
                continue
            # Comprobar reservas en el slot
            if start_dt and end_dt:
                bookings = (
                    db.query(ResourceBooking)
                    .filter(ResourceBooking.resource_id == resource.id)
                    .filter(ResourceBooking.status.in_(["booked", "maintenance"]))
                    .all()
                )
                conflict = any(_overlaps(start_dt, end_dt, b.start_datetime, b.end_datetime) for b in bookings)
                if conflict:
                    continue
            allocated = min(available_qty, remaining)
            if allocated <= 0:
                continue
            matches.append({
                "id": resource.id,
                "name": resource.name,
                "type": resource.type,
                "location": resource.location,
                "available_quantity": resource.quantity,
                "allocated_quantity": allocated,
                "available": resource.available,
            })
            remaining -= allocated
            if remaining <= 0:
                break

        fulfilled = req.quantity - remaining if req.quantity else len(matches)
        assignments.append({
            "request": req.model_dump(),
            "assignments": matches,
            "fulfilled_quantity": max(fulfilled, 0),
        })

        if remaining > 0:
            gaps.append({
                "type": req.type,
                "name": req.name,
                "quantity": remaining,
                "status": "no disponible o en mantenimiento",
            })

    plan = {
        "scheduled_datetime": plan_request.scheduled_datetime.isoformat() if plan_request.scheduled_datetime else None,
        "notes": plan_request.notes,
        "assignments": assignments,
    }

    return plan, gaps


def _merge_lists(*lists: list[str] | None) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for lst in lists:
        if not lst:
            continue
        for item in lst:
            value = (item or "").strip()
            if not value:
                continue
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append(value)
    return merged

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
    
        # Evaluación por README corporativos
        compliance = evaluate_compliance(doc_text)
        compliance_result = compliance.get("result", {})
        comp_status = compliance_result.get("status")
        comp_summary = compliance_result.get("summary")
        comp_alerts = compliance_result.get("alerts", [])
        comp_missing = compliance_result.get("missing", [])
        comp_evidence = compliance_result.get("evidence", [])
        logger.info(
            "Resultado compliance README: status=%s, alerts=%d, missing=%d",
            comp_status,
            len(comp_alerts),
            len(comp_missing),
        )

        # Analizar con IA (Ollama / fallback) como complemento informativo
        ref_text = load_reference_text()
        logger.info(f"Referencias IA cargadas: longitud={len(ref_text)}")
        ai = OitAiService()
        logger.info("Iniciando análisis IA complementario")
        ai_result = ai.analyze(doc_text, ref_text)

        status = comp_status or ai_result.get("status", "error")
        summary = comp_summary or ai_result.get("summary")
        alerts = _merge_lists(comp_alerts, ai_result.get("alerts"))
        missing = _merge_lists(comp_missing, ai_result.get("missing"))
        evidence = _merge_lists(comp_evidence, ai_result.get("evidence"))
        logger.info(
            "Resultado final: status=%s, alerts=%d, missing=%d, evidence=%d",
            status,
            len(alerts),
            len(missing),
            len(evidence),
        )

        # Guardar en BD (ruta relativa a back/)
        review_notes = ai_result.get("notes") or ai_result.get("summary") or ""

        doc = OitDocument(
            filename=str(dest.relative_to(BACK_DIR)),  # uploads/oit/<archivo>
            original_name=file.filename,
            status=status,
            summary=summary,
            alerts=json.dumps(alerts, ensure_ascii=False),
            missing=json.dumps(missing, ensure_ascii=False),
            evidence=json.dumps(evidence, ensure_ascii=False),
            compliance_bundle_path=None,
            compliance_report_path=None,
            approval_status="pending",
            resource_plan=None,
            resource_gaps=None,
            approval_notes=None,
            review_notes=review_notes,
            created_by_id=current_user.id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Documento OIT persistido id={doc.id}")

        # Guardar reportes compliance
        bundle_path = _bundle_path_for(doc)
        report_path = _report_path_for(doc)

        bundle_relative = None
        report_relative = None
        try:
            bundle_path.write_text(compliance.get("readme_combined", ""), encoding="utf-8")
            bundle_relative = str(bundle_path.relative_to(BACK_DIR))
        except Exception as exc:
            logger.warning(f"No se pudo escribir bundle README: {exc}")
        try:
            report_path.write_text(json.dumps(compliance, ensure_ascii=False, indent=2), encoding="utf-8")
            report_relative = str(report_path.relative_to(BACK_DIR))
        except Exception as exc:
            logger.warning(f"No se pudo escribir reporte compliance: {exc}")

        doc.compliance_bundle_path = bundle_relative
        doc.compliance_report_path = report_relative
        doc.can_recommend = doc.status == "check" and len(alerts) == 0 and len(missing) == 0
        db.add(doc)
        db.commit()
        db.refresh(doc)

        notification_type = "oit.approved" if doc.status == "check" else "oit.review_required"
        notification_title = "OIT lista" if doc.status == "check" else "OIT requiere revisión"
        notification_message = (
            f"La OIT #{doc.id} fue aprobada sin alertas." if doc.status == "check" else doc.summary or "La IA detectó observaciones."
        )
        create_notification(
            db,
            user_id=current_user.id,
            type=notification_type,
            title=notification_title,
            message=notification_message,
            document_id=doc.id,
            payload={
                "status": doc.status,
                "alerts": alerts,
                "missing": missing,
            },
        )

        return _serialize_doc(doc)
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
        compliance = evaluate_compliance(doc_text)
        compliance_result = compliance.get("result", {})
        comp_status = compliance_result.get("status")
        comp_summary = compliance_result.get("summary")
        comp_alerts = compliance_result.get("alerts", [])
        comp_missing = compliance_result.get("missing", [])
        comp_evidence = compliance_result.get("evidence", [])
        logger.info(
            "Resultado compliance README RAW: status=%s, alerts=%d, missing=%d",
            comp_status,
            len(comp_alerts),
            len(comp_missing),
        )

        ref_text = load_reference_text()
        ai = OitAiService()
        logger.info("Iniciando análisis IA RAW complementario")
        ai_result = ai.analyze(doc_text, ref_text)

        status = comp_status or ai_result.get("status", "error")
        summary = comp_summary or ai_result.get("summary")
        alerts = _merge_lists(comp_alerts, ai_result.get("alerts"))
        missing = _merge_lists(comp_missing, ai_result.get("missing"))
        evidence = _merge_lists(comp_evidence, ai_result.get("evidence"))
        logger.info(
            "Resultado final RAW: status=%s, alerts=%d, missing=%d, evidence=%d",
            status,
            len(alerts),
            len(missing),
            len(evidence),
        )

        doc = OitDocument(
            filename=str(dest.relative_to(BACK_DIR)),
            original_name="raw.txt",
            status=status,
            summary=summary,
            alerts=json.dumps(alerts, ensure_ascii=False),
            missing=json.dumps(missing, ensure_ascii=False),
            evidence=json.dumps(evidence, ensure_ascii=False),
            compliance_bundle_path=None,
            compliance_report_path=None,
            approval_status="pending",
            resource_plan=None,
            resource_gaps=None,
            approval_notes=None,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Documento OIT RAW persistido id={doc.id}")

        bundle_path = _bundle_path_for(doc)
        report_path = _report_path_for(doc)
        bundle_relative = None
        report_relative = None
        try:
            bundle_path.write_text(compliance.get("readme_combined", ""), encoding="utf-8")
            bundle_relative = str(bundle_path.relative_to(BACK_DIR))
        except Exception as exc:
            logger.warning(f"No se pudo escribir bundle README RAW: {exc}")
        try:
            report_path.write_text(json.dumps(compliance, ensure_ascii=False, indent=2), encoding="utf-8")
            report_relative = str(report_path.relative_to(BACK_DIR))
        except Exception as exc:
            logger.warning(f"No se pudo escribir reporte compliance RAW: {exc}")

        doc.compliance_bundle_path = bundle_relative
        doc.compliance_report_path = report_relative
        doc.can_recommend = doc.status == "check" and len(alerts) == 0 and len(missing) == 0
        db.add(doc)
        db.commit()
        db.refresh(doc)

        return _serialize_doc(doc)

@router.get("/oit/{doc_id}", response_model=OitDocumentOut)
def get_oit(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return _serialize_doc(doc)

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
                    compliance_bundle_path=None,
                    compliance_report_path=None,
                    approval_status="approved",
                    resource_plan=json.dumps({"assignments": [], "scheduled_date": None, "notes": "Ejemplo"}, ensure_ascii=False),
                    resource_gaps=json.dumps({"items": []}, ensure_ascii=False),
                    approval_notes=None,
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)
                docs = [doc]
            else:
                docs = [existing]

    return [_serialize_doc(d) for d in docs]


@router.get("/oit/{doc_id}/reference-bundle")
def download_reference_bundle(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    bundle_path = _bundle_path_for(doc)
    if doc.compliance_bundle_path and (BACK_DIR / doc.compliance_bundle_path).exists():
        bundle_path = BACK_DIR / doc.compliance_bundle_path
    elif not bundle_path.exists():
        raise HTTPException(status_code=404, detail="Bundle de referencia no disponible")
    return FileResponse(bundle_path, media_type="text/markdown", filename=bundle_path.name)

@router.get("/oit/{doc_id}/recommendations")
def oit_recommendations(doc_id: int, db: Session = Depends(get_db), current_user: SystemUser = Depends(get_current_user)):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    file_path = BACK_DIR / doc.filename
    text = ""
    try:
        text = extract_text(file_path)
    except Exception:
        text = ""

    ai = OitAiService()
    ai_result = ai.recommend_resources(text)
    recs = ai_result.get("recommendations", [])
    schedule = ai_result.get("schedule")

    matches: Dict[str, List[Dict[str, Any]]] = {}
    for rec in recs:
        type_ = rec.get("type")
        if not type_:
            continue
        items = db.query(Resource).filter(func.lower(Resource.type) == type_.lower()).all()
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

    return {"recommendations": recs, "matches": matches, "schedule": schedule}


@router.post("/oit/{doc_id}/plan")
def create_plan(
    doc_id: int,
    payload: PlanRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    plan_request = payload

    file_path = BACK_DIR / doc.filename
    text = ""
    try:
        text = extract_text(file_path)
    except Exception:
        text = ""

    ai = OitAiService()
    ai_result = ai.recommend_resources(text)
    recs = ai_result.get("recommendations", [])
    schedule = ai_result.get("schedule") or {}

    if not plan_request.requested_resources:
        for rec in recs:
            plan_request.requested_resources.append(
                ResourceRequest(
                    type=rec.get("type", "insumo"),
                    name=rec.get("name"),
                    quantity=max(int(rec.get("quantity", 1) or 1), 1),
                )
            )

    if plan_request.scheduled_datetime is None and schedule:
        date_str = schedule.get("suggested_date")
        time_str = schedule.get("suggested_time") or "09:00"
        if date_str:
            try:
                plan_request.scheduled_datetime = datetime.fromisoformat(f"{date_str}T{time_str}")
            except Exception:
                plan_request.scheduled_datetime = None

    plan, gaps = _build_plan(doc, plan_request, db)
    if schedule:
        plan["ai_schedule"] = schedule

    doc.resource_plan = json.dumps(plan, ensure_ascii=False)
    doc.resource_gaps = json.dumps({"items": gaps}, ensure_ascii=False)
    doc.approval_status = "pending"
    doc.approved_schedule_date = plan_request.scheduled_datetime
    doc.approval_notes = plan_request.notes
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Alertar por faltantes si existen
    try:
        if gaps:
            create_notification(
                db,
                user_id=current_user.id,
                type="oit.plan_revision",
                title="Recursos faltantes para la OIT",
                message=f"La OIT #{doc.id} tiene recursos faltantes o no disponibles. Revisa y solicita ajustes.",
                document_id=doc.id,
                payload={"gaps": gaps},
            )
    except Exception:
        pass

    return {
        "approval_status": doc.approval_status,
        "plan": plan,
        "schedule": schedule,
        "gaps": gaps,
        "document": _serialize_doc(doc)
    }


@router.post("/oit/{doc_id}/plan/confirm", response_model=OitDocumentOut)
def confirm_plan(
    doc_id: int,
    payload: PlanConfirmRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Determinar faltantes vigentes para validar aprobación
    gaps_payload: Any = payload.gaps if payload.gaps is not None else None
    if gaps_payload is None:
        try:
            gaps_payload = json.loads(doc.resource_gaps) if doc.resource_gaps else None
        except Exception:
            gaps_payload = None

    gap_items = _extract_gap_items(gaps_payload)
    has_pending_gaps = any((gap or {}).get("quantity", 0) > 0 for gap in gap_items)

    if payload.approved and has_pending_gaps:
        raise HTTPException(
            status_code=400,
            detail="No se puede aprobar el plan mientras existan recursos faltantes.",
        )

    if payload.plan is not None:
        doc.resource_plan = json.dumps(payload.plan, ensure_ascii=False)
    if payload.gaps is not None:
        doc.resource_gaps = json.dumps(payload.gaps, ensure_ascii=False)

    if payload.approved:
        doc.approval_status = "approved"
        doc.approved_schedule_date = payload.scheduled_datetime
        # Crear reservas para los recursos asignados
        try:
            plan_obj = payload.plan or json.loads(doc.resource_plan or "{}")
            assigns = plan_obj.get("assignments", []) if isinstance(plan_obj, dict) else []
            start_dt = doc.approved_schedule_date
            end_dt = start_dt.replace(hour=start_dt.hour + 2) if start_dt else None
            for entry in assigns:
                for m in (entry.get("assignments") or []):
                    res_id = m.get("id")
                    qty = m.get("allocated_quantity", 0)
                    if res_id and start_dt and end_dt and qty > 0:
                        booking = ResourceBooking(resource_id=res_id, start_datetime=start_dt, end_datetime=end_dt, status="booked")
                        db.add(booking)
            db.commit()
        except Exception:
            pass
    else:
        doc.approval_status = "needs_revision"
        doc.approved_schedule_date = None

    doc.approval_notes = payload.notes

    db.add(doc)
    db.commit()
    db.refresh(doc)

    notification_type = "oit.plan_approved" if payload.approved else "oit.plan_revision"
    notification_title = "Programación aprobada" if payload.approved else "Programación requiere ajustes"
    notification_message = (
        f"La programación de la OIT #{doc.id} fue aprobada." if payload.approved else payload.notes or "Se solicitaron ajustes a la programación."
    )
    create_notification(
        db,
        user_id=current_user.id,
        type=notification_type,
        title=notification_title,
        message=notification_message,
        document_id=doc.id,
        payload={
            "approval_status": doc.approval_status,
            "scheduled_date": doc.approved_schedule_date.isoformat() if doc.approved_schedule_date else None,
        },
    )

    return _serialize_doc(doc)

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
    # Validar que el análisis haya sido subido
    status = _read_sampling_status(doc)
    if not status.final_report_allowed:
        raise HTTPException(status_code=403, detail="El informe final sólo se genera después de subir el análisis")
    # Cargar contenido del análisis (texto); si no existe, intentar extraer del PDF
    analysis_text = ""
    try:
        analysis_text = _analysis_path_for(doc).read_text(encoding="utf-8")
    except Exception:
        analysis_text = ""
    if not analysis_text:
        pdf_path = _analysis_file_path_for(doc)
        try:
            if pdf_path.exists():
                analysis_text = extract_text(pdf_path) or ""
        except Exception:
            analysis_text = ""

    # Construir texto básico de informe; en el futuro se puede invocar IA
    lines = []
    lines.append(f"INFORME FINAL OIT #{doc.id}")
    lines.append("")
    lines.append(f"Documento: {doc.original_name or doc.filename}")
    lines.append(f"Estado: {doc.status}")
    lines.append(f"Programación aprobada: {doc.approval_status}")
    lines.append(f"Fecha de carga: {doc.created_at}")
    lines.append("")
    lines.append("Resumen:")
    lines.append(doc.summary or "(sin resumen)")
    lines.append("")
    lines.append("Datos de Muestreo:")
    for k, v in (sampling or {}).items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append("Análisis:")
    lines.append(analysis_text or "(sin análisis)")
    content = "\n".join(lines)

    def _iter():
        yield content

    filename = f"informe_final_{doc_id}.txt"
    headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
    return StreamingResponse(_iter(), media_type="text/plain", headers=headers)

@router.post("/oit/{doc_id}/final-report/html")
def generate_final_report_html(
    doc_id: int,
    sampling: dict = Body(..., description="Datos del formulario de muestreo"),
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    doc = db.query(OitDocument).filter(OitDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    status = _read_sampling_status(doc)
    if not status.final_report_allowed:
        raise HTTPException(status_code=403, detail="El informe final sólo se genera después de subir el análisis")
    analysis_text = ""
    try:
        analysis_text = _analysis_path_for(doc).read_text(encoding="utf-8")
    except Exception:
        analysis_text = ""
    if not analysis_text:
        pdf_path = _analysis_file_path_for(doc)
        try:
            if pdf_path.exists():
                analysis_text = extract_text(pdf_path) or ""
        except Exception:
            analysis_text = ""

    tpl_path = BACK_DIR / "app" / "report_templates" / "final_report.html"
    try:
        html = tpl_path.read_text(encoding="utf-8")
    except Exception:
        raise HTTPException(status_code=500, detail="No se encontró la plantilla HTML")

    sampling_items = "\n".join([f"<li><strong>{k}:</strong> {v}</li>" for k, v in (sampling or {}).items()])
    out = (
        html
        .replace("{{doc_id}}", str(doc.id))
        .replace("{{doc_name}}", doc.original_name or doc.filename)
        .replace("{{doc_status}}", doc.status)
        .replace("{{approved_status}}", doc.approval_status)
        .replace("{{created_at}}", str(doc.created_at))
        .replace("{{summary}}", (doc.summary or "(sin resumen)").replace("<", "&lt;").replace(">", "&gt;"))
        .replace("{{sampling_items}}", sampling_items)
        .replace("{{analysis_text}}", (analysis_text or "(sin análisis)").replace("<", "&lt;").replace(">", "&gt;"))
    )
    return Response(content=out, media_type="text/html", headers={"Content-Disposition": f"attachment; filename=\"informe_final_{doc_id}.html\""})