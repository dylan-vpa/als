import json
# Import condicional de requests para no romper si no está instalado
try:
    import requests  # type: ignore
except Exception:
    requests = None  # type: ignore
from pathlib import Path
from typing import Dict, List, Optional, Literal

# Import condicional de pypdf
try:
    from pypdf import PdfReader  # type: ignore
except Exception:
    PdfReader = None  # type: ignore
import logging
import os

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL_NAME = "llama3.2:3b"

logger = logging.getLogger("oit.ai")

class OitAiService:
    def __init__(self, base_url: str = DEFAULT_OLLAMA_URL, model: str = DEFAULT_MODEL_NAME):
        # Permitir sobreescribir por variables de entorno
        env_url = os.getenv("PARADIXE_OLLAMA_URL", base_url)
        env_model = os.getenv("PARADIXE_OLLAMA_MODEL", model)
        self.base_url = env_url.rstrip("/")
        self.model = env_model
        self.force_fallback = os.getenv("PARADIXE_AI_FALLBACK", "false").lower() in ("1", "true", "yes")
        
    def get_available_models(self) -> List[Dict]:
        """Obtiene la lista de modelos disponibles en el servidor Ollama"""
        try:
            url = f"{self.base_url}/api/tags"
            data = self._post_json(url, {}, timeout=10)
            models = data.get("models", [])
            return models
        except Exception as e:
            logger.warning(f"Error al obtener modelos disponibles: {e}")
            return []
            
    def is_model_available(self, model_name: Optional[str] = None) -> bool:
        """Verifica si un modelo específico está disponible"""
        if self.force_fallback:
            return False
            
        model = model_name or self.model
        try:
            models = self.get_available_models()
            return any(m.get("name") == model for m in models)
        except Exception:
            return False

    def _heuristic_review(self, document_text: str, reference_text: str) -> Dict:
        text = (document_text or "").strip()
        if not text:
            return {
                "status": "error",
                "summary": "Documento vacío o ilegible",
                "alerts": [],
                "missing": ["Contenido legible"],
                "evidence": []
            }
        lower = text.lower()
        criteria = {
            "identificador": "Identificador del OIT presente",
            "fecha": "Fecha del documento presente",
            "alcance": "Alcance y propósito definidos",
            "requisito": "Lista de requisitos incluida",
            "firma": "Firmas o validación del responsable"
        }
        hits = [v for k, v in criteria.items() if k in lower]
        missing = [v for k, v in criteria.items() if k not in lower]
        status = "check" if not missing else ("alerta" if len(missing) <= 2 else "error")
        alerts = [] if status != "alerta" else ["Criterios mínimos parcialmente cumplidos"]
        summary = f"Revisión heurística: {len(hits)} presentes, {len(missing)} faltantes."
        evidence = hits[:5]
        return {
            "status": status,
            "summary": summary,
            "alerts": alerts,
            "missing": missing,
            "evidence": evidence
        }

    def _post_json(self, url: str, payload: Dict, timeout: int = 90) -> Dict:
        """POST JSON usando requests si está disponible; si no, urllib estándar."""
        if requests is not None:  # type: ignore
            resp = requests.post(url, json=payload, timeout=timeout)  # type: ignore
            resp.raise_for_status()
            return resp.json()
        # Fallback stdlib
        try:
            from urllib.request import Request, urlopen
            from urllib.error import URLError, HTTPError
            import ssl
            data = json.dumps(payload).encode("utf-8")
            req = Request(url, data=data, headers={"Content-Type": "application/json"})
            ctx = ssl.create_default_context()
            with urlopen(req, timeout=timeout, context=ctx) as resp:
                body = resp.read().decode("utf-8", errors="ignore")
                try:
                    return json.loads(body)
                except Exception:
                    # Algunos modelos devuelven texto plano; encapsular
                    return {"response": body}
        except HTTPError as e:
            try:
                detail = e.read().decode("utf-8", errors="ignore")
            except Exception:
                detail = str(e)
            raise RuntimeError(f"HTTP {e.code}: {detail}")
        except URLError as e:  # type: ignore
            raise RuntimeError(f"Error de red: {getattr(e, 'reason', e)}")
        except Exception as e:
            raise RuntimeError(f"Fallo al realizar POST: {e}")

    def analyze(self, document_text: str, reference_text: str) -> Dict:
        if self.force_fallback:
            logger.info("Fallback IA forzado por PARADIXE_AI_FALLBACK; usando heurística")
            return self._heuristic_review(document_text, reference_text)

        # Prompt estricto con contrato de salida JSON
        prompt = (
            "Eres un validador estricto de OIT. Debes analizar el DOCUMENTO usando las REFERENCIAS "
            "y devolver EXCLUSIVAMENTE un objeto JSON válido que cumpla el siguiente esquema. "
            "No agregues comentarios ni explicaciones fuera del JSON. Si algún campo no aplica, usa una cadena vacía o una lista vacía. "
            "\n\n[SCHEMA]\n"
            "{\n"
            "  \"status\": \"check|alerta|error\",\n"
            "  \"summary\": string,\n"
            "  \"alerts\": string[],\n"
            "  \"missing\": string[],\n"
            "  \"evidence\": string[]\n"
            "}\n\n"
            "[REFERENCIAS]\n" + reference_text + "\n\n" +
            "[DOCUMENTO]\n" + document_text + "\n\n" +
            "Devuelve solo el JSON del esquema indicado, perfectamente validado."
        )
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            # Forzar salida JSON con Ollama (cuando el servidor lo soporta)
            "format": "json",
            "options": {"temperature": 0.0, "num_ctx": 8192}
        }
        url = f"{self.base_url}/api/generate"
        try:
            logger.info(f"Llamando Ollama generate en {self.base_url} con modelo={self.model}")
            data = self._post_json(url, payload, timeout=90)
            raw = (data.get("response") or "").strip()
            if not raw:
                # Algunos servidores responden bajo otra clave o vacío
                raw = json.dumps(data, ensure_ascii=False)
            # Intentar parseo estricto de JSON
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # Intentar extraer el primer objeto JSON del texto
                start = raw.find("{")
                end = raw.rfind("}")
                if start != -1 and end != -1:
                    try:
                        parsed = json.loads(raw[start:end+1])
                    except Exception:
                        logger.warning("Salida del modelo no es JSON; aplicando fallback heurístico")
                        return self._heuristic_review(document_text, reference_text)
                else:
                    logger.warning("Salida del modelo no es JSON; aplicando fallback heurístico")
                    return self._heuristic_review(document_text, reference_text)
            # Validación mínima del contrato
            def _ensure_list(v):
                return v if isinstance(v, list) else ([] if v is None else [str(v)])
            parsed.setdefault("status", "error")
            parsed.setdefault("summary", "")
            parsed["alerts"] = _ensure_list(parsed.get("alerts"))
            parsed["missing"] = _ensure_list(parsed.get("missing"))
            parsed["evidence"] = _ensure_list(parsed.get("evidence"))
            # Normalizar status
            st = str(parsed.get("status", "")).lower()
            if st not in ("check", "alerta", "error"):
                parsed["status"] = "error"
            logger.info("Respuesta IA válida (JSON) y normalizada")
            return parsed
        except Exception as e:
            logger.warning(f"Fallo al invocar Ollama: {e}; aplicando fallback heurístico")
            return self._heuristic_review(document_text, reference_text)

    def chat(self, message: str, system_prompt: Optional[str] = None, model: Optional[str] = None) -> Dict[str, str]:
        """
        Realiza una consulta de chat al modelo especificado.
        
        Args:
            message: Mensaje del usuario
            system_prompt: Prompt de sistema opcional
            model: Modelo a utilizar (si es None, usa el modelo por defecto)
            
        Returns:
            Dict con la respuesta y si se usó fallback
        """
        use_model = model or self.model
        
        if self.force_fallback or not self.is_model_available(use_model):
            # Fallback mínimo
            hint = message.strip()
            if not hint:
                hint = "(sin contenido)"
            reply = (
                f"(IA local no disponible - modelo {use_model}) Respuesta aproximada: he recibido tu mensaje y puedo ayudarte a resumir, "
                f"analizar OITs y recomendar recursos. Por favor, indica tu duda específica. \n\nTexto: {hint[:500]}"
            )
            return {"reply": reply, "used_fallback": True}
        
        # Intentar usar generate de Ollama como chat básico
        default_system = "Eres un asistente útil y conciso para operaciones OIT. Responde en español."
        sys_prompt = system_prompt or default_system
        
        payload = {
            "model": use_model,
            "prompt": f"[SISTEMA]: {sys_prompt}\n\n[USUARIO]: {message}",
            "stream": False,
            "options": {"temperature": 0.2, "num_ctx": 4096},
        }
        
        url = f"{self.base_url}/api/generate"
        try:
            data = self._post_json(url, payload, timeout=60)
            reply = (data.get("response") or "").strip()
            if not reply:
                raise RuntimeError("Respuesta vacía del modelo")
            return {"reply": reply, "used_fallback": False}
        except Exception as e:
            logger.warning(f"Error al usar el modelo {use_model}: {e}")
            # Fallback mínimo
            hint = message.strip()
            if not hint:
                hint = "(sin contenido)"
            reply = (
                f"(IA local no disponible - modelo {use_model}) Respuesta aproximada: he recibido tu mensaje y puedo ayudarte a resumir, "
                f"analizar OITs y recomendar recursos. Por favor, indica tu duda específica. \n\nTexto: {hint[:500]}"
            )
            return {"reply": reply, "used_fallback": True}
    
    def check_document(self, document_text: str, reference_text: str, model: Optional[str] = None) -> Dict:
        """
        Verifica un documento usando el modelo especificado.
        
        Args:
            document_text: Texto del documento a verificar
            reference_text: Texto de referencia
            model: Modelo a utilizar (si es None, usa el modelo por defecto)
            
        Returns:
            Dict con el resultado del análisis
        """
        use_model = model or self.model
        
        if self.force_fallback or not self.is_model_available(use_model):
            logger.info(f"Modelo {use_model} no disponible o fallback forzado; usando heurística")
            return self._heuristic_review(document_text, reference_text)
            
        # Prompt estricto con contrato de salida JSON
        prompt = (
            "Eres un validador estricto de OIT. Debes analizar el DOCUMENTO usando las REFERENCIAS "
            "y devolver EXCLUSIVAMENTE un objeto JSON válido que cumpla el siguiente esquema. "
            "No agregues comentarios ni explicaciones fuera del JSON. Si algún campo no aplica, usa una cadena vacía o una lista vacía. "
            "\n\n[SCHEMA]\n"
            "{\n"
            "  \"status\": \"check|alerta|error\",\n"
            "  \"summary\": string,\n"
            "  \"alerts\": string[],\n"
            "  \"missing\": string[],\n"
            "  \"evidence\": string[]\n"
            "}\n\n"
            "[REFERENCIAS]\n" + reference_text + "\n\n" +
            "[DOCUMENTO]\n" + document_text + "\n\n" +
            "Devuelve solo el JSON del esquema indicado, perfectamente validado."
        )
        
        payload = {
            "model": use_model,
            "prompt": prompt,
            "stream": False,
            # Forzar salida JSON con Ollama (cuando el servidor lo soporta)
            "format": "json",
            "options": {"temperature": 0.0, "num_ctx": 8192}
        }
        
        url = f"{self.base_url}/api/generate"
        try:
            logger.info(f"Llamando Ollama generate en {self.base_url} con modelo={use_model}")
            data = self._post_json(url, payload, timeout=90)
            raw = (data.get("response") or "").strip()
            if not raw:
                # Algunos servidores responden bajo otra clave o vacío
                raw = json.dumps(data, ensure_ascii=False)
            # Intentar parseo estricto de JSON
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # Intentar extraer el primer objeto JSON del texto
                start = raw.find("{")
                end = raw.rfind("}")
                if start != -1 and end != -1:
                    try:
                        parsed = json.loads(raw[start:end+1])
                    except Exception:
                        logger.warning("Salida del modelo no es JSON; aplicando fallback heurístico")
                        return self._heuristic_review(document_text, reference_text)
                else:
                    logger.warning("Salida del modelo no es JSON; aplicando fallback heurístico")
                    return self._heuristic_review(document_text, reference_text)
            # Validación mínima del contrato
            def _ensure_list(v):
                return v if isinstance(v, list) else ([] if v is None else [str(v)])
            parsed.setdefault("status", "error")
            parsed.setdefault("summary", "")
            parsed["alerts"] = _ensure_list(parsed.get("alerts"))
            parsed["missing"] = _ensure_list(parsed.get("missing"))
            parsed["evidence"] = _ensure_list(parsed.get("evidence"))
            # Normalizar status
            st = str(parsed.get("status", "")).lower()
            if st not in ("check", "alerta", "error"):
                parsed["status"] = "error"
            logger.info("Respuesta IA válida (JSON) y normalizada")
            return parsed
        except Exception as e:
            logger.warning(f"Fallo al invocar Ollama con modelo {use_model}: {e}; aplicando fallback heurístico")
            return self._heuristic_review(document_text, reference_text)
    
    def analyze(self, document_text: str, reference_text: str) -> Dict:
        """Método de compatibilidad que llama a check_document con el modelo por defecto"""
        return self.check_document(document_text, reference_text)

    def recommend_resources(self, document_text: str) -> List[Dict]:
        """Devuelve recomendaciones de recursos basadas en heurísticas simples del texto."""
        text = (document_text or "").lower()
        recs: List[Dict] = []
        def add(type_: str, name: str, quantity: int, reason: str):
            recs.append({
                "type": type_,
                "name": name,
                "quantity": quantity,
                "reason": reason
            })
        # Heurísticas
        if any(k in text for k in ["campo", "terreno", "sitio", "mina", "pozo"]):
            add("vehiculo", "Camioneta 4x4", 1, "Desplazamiento al sitio de trabajo")
            add("equipo", "GPS portátil", 1, "Georreferenciación de puntos de muestreo")
        if any(k in text for k in ["muestra", "muestreo", "laboratorio", "analisis", "análisis"]):
            add("equipo", "Kit de muestreo", 1, "Recolección de muestras en campo")
            add("equipo", "Nevera portátil", 1, "Conservación de muestras")
        if any(k in text for k in ["agua", "superficie", "subterranea", "subterránea", "rio", "río"]):
            add("equipo", "Medidor de pH/Conductividad", 1, "Parámetros in situ del agua")
        if any(k in text for k in ["seguridad", "riesgo", "peligro", "ppe", "epp"]):
            add("insumo", "EPP básico", 4, "Seguridad del personal (guantes, casco, lentes)")
        if any(k in text for k in ["personal", "brigada", "tecnico", "técnico", "inspección"]):
            add("personal", "Técnico de muestreo", 2, "Ejecución y registro del muestreo")
        # Siempre ofrecer supervisor si el documento está en estado operativo
        add("personal", "Supervisor", 1, "Coordinación general y calidad")
        # Dedup por (type,name)
        unique = {}
        for r in recs:
            key = (r["type"], r["name"]) 
            if key not in unique:
                unique[key] = r
        return list(unique.values())


def extract_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        if PdfReader is None:
            # Librería no disponible, intentar leer como texto o retornar vacío
            try:
                return file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                return ""
        try:
            reader = PdfReader(str(file_path))
            text = "\n".join([p.extract_text() or "" for p in reader.pages])
            return text.strip()
        except Exception:
            return ""
    # Fallback: tratar como texto
    try:
        return file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        try:
            return file_path.read_text(encoding="latin-1", errors="ignore")
        except Exception:
            return ""


def load_reference_text() -> str:
    # Directorio de referencias: back/app/reference_data
    base_dir = Path(__file__).resolve().parents[1]
    ref_dir = base_dir / "reference_data"
    if not ref_dir.exists():
        return ""
    texts = []
    for p in ref_dir.glob("**/*"):
        if p.is_file() and p.suffix.lower() in {".txt", ".md", ".json"}:
            try:
                texts.append(p.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                pass
    return "\n\n".join(texts)