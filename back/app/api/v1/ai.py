from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from typing import Optional, List, Dict

from ...core.dependencies import get_current_user
from ...models.system_user import SystemUser
from ...services.ai import OitAiService

router = APIRouter(tags=["ai"], prefix="/ai")

class ChatRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    used_fallback: bool = False
    model: Optional[str] = None

class ModelsResponse(BaseModel):
    models: List[str]
    default_model: str

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, current_user: SystemUser = Depends(get_current_user)):
    """Chat con el modelo local (Ollama). Si no está disponible, usa fallback.
    Permite especificar el modelo a utilizar.
    """
    ai = OitAiService()
    result = ai.chat(
        message=req.message,
        system_prompt=req.system_prompt,
        model=req.model
    )
    return ChatResponse(reply=result["reply"], used_fallback=result.get("used_fallback", False), model=(req.model or ai.model))

@router.get("/models", response_model=ModelsResponse)
def get_models(current_user: SystemUser = Depends(get_current_user)):
    """Obtiene la lista de modelos disponibles en el servidor Ollama"""
    ai = OitAiService()
    models = ai.get_available_models()
    # Convertir a lista de nombres simple como espera el frontend
    names: List[str] = []
    for m in models:
        name = m.get("name") if isinstance(m, dict) else None
        if name:
            names.append(name)
    return ModelsResponse(models=names, default_model=ai.model)

@router.post("/check-document", response_model=Dict)
def check_document(
    document_text: str = Body(..., embed=True),
    reference_text: Optional[str] = Body(None, embed=True),
    model: Optional[str] = Body(None, embed=True),
    current_user: SystemUser = Depends(get_current_user)
):
    """Verifica un documento usando el modelo especificado"""
    ai = OitAiService()
    ref = reference_text or load_reference_text()
    result = ai.check_document(document_text, ref, model)
    return result

# Función auxiliar para cargar texto de referencia
def load_reference_text() -> str:
    """Carga el texto de referencia para análisis de OIT"""
    from ...services.ai import load_reference_text as load_ref
    return load_ref()