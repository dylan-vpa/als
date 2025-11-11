from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Tuple

COMPLIANCE_DIR = Path(__file__).resolve().parents[1] / "reference_data" / "compliance"

_STOPWORDS = {
    "del",
    "para",
    "este",
    "esta",
    "las",
    "los",
    "una",
    "unos",
    "unas",
    "con",
    "por",
    "sobre",
    "entre",
    "cada",
    "de",
    "el",
    "la",
    "que",
    "se",
    "su",
    "sus",
}


def _iter_readme_files() -> List[Tuple[str, str]]:
    if not COMPLIANCE_DIR.exists():
        return []
    docs: List[Tuple[str, str]] = []
    for path in sorted(COMPLIANCE_DIR.glob("**/*.md")):
        if not path.is_file():
            continue
        try:
            docs.append((path.name, path.read_text(encoding="utf-8", errors="ignore")))
        except Exception:
            continue
    return docs


def _extract_requirements(content: str, source: str) -> List[Dict[str, str]]:
    requirements: List[Dict[str, str]] = []
    for line in content.splitlines():
        line = line.strip()
        if not line or not line.startswith("-"):
            continue
        requirement = line[1:].strip()
        if requirement:
            requirements.append({"text": requirement, "source": source})
    return requirements


def _first_keyword(text: str) -> str | None:
    tokens = re.findall(r"[a-záéíóúñü]+", text.lower())
    for token in tokens:
        if token in _STOPWORDS or len(token) < 4:
            continue
        return token
    return tokens[0] if tokens else None


def _build_combined_readme(docs: List[Tuple[str, str]]) -> str:
    parts: List[str] = []
    for name, content in docs:
        parts.append(f"# {name}\n\n{content.strip()}\n")
    return "\n\n".join(parts).strip()


def evaluate_compliance(document_text: str) -> Dict[str, object]:
    docs = _iter_readme_files()
    combined_readme = _build_combined_readme(docs) if docs else ""

    requirements: List[Dict[str, str]] = []
    for name, content in docs:
        requirements.extend(_extract_requirements(content, name))

    lower_text = (document_text or "").lower()
    passed: List[Dict[str, str]] = []
    failed: List[Dict[str, str]] = []

    for req in requirements:
        keyword = _first_keyword(req["text"])
        if keyword and keyword in lower_text:
            passed.append(req)
        else:
            failed.append(req)

    if not requirements:
        status = "check"
        summary = "No se encontraron README de referencia para validar."
        alerts: List[str] = []
        missing: List[str] = []
        evidence: List[str] = []
    else:
        summary = f"Validación README: {len(passed)} criterios cumplidos, {len(failed)} faltantes."
        if not failed:
            status = "check"
            alerts = []
        elif len(failed) <= 2:
            status = "alerta"
            alerts = ["Cumplimiento parcial de normas README. Revisión necesaria."]
        else:
            status = "error"
            alerts = ["No cumple con las normas README requeridas."]
        missing = [f"{item['text']} ({item['source']})" for item in failed]
        evidence = [f"{item['text']} ({item['source']})" for item in passed]

    result = {
        "status": status,
        "summary": summary,
        "alerts": alerts,
        "missing": missing,
        "evidence": evidence,
    }

    report = {
        "result": result,
        "requirements": requirements,
        "readme_combined": combined_readme,
    }

    return report
