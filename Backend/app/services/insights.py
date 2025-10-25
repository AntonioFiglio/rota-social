"""Gera insights sinteticos com OpenAI opcional e fallback mock."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Dict, Tuple

import requests

from ..models import FamilyProfile, InsightFamilyRequest, InsightStudentRequest, StudentProfile
from ..storage import append_audit, get_family, get_student

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
TIMEOUT_SECONDS = 15


def _timestamp() -> str:
    return datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()


def _mock_student_insight(student: StudentProfile, signals: Dict[str, str]) -> str:
    zone = student.zone
    highlight = signals.get("highlight", "acompanhar transporte e presença")
    return (
        f"No {zone}, {student.id} pode se beneficiar de apoio extra para {highlight}. "
        "Quais iniciativas a família considera viáveis nas próximas semanas?"
    )


def _mock_family_insight(family: FamilyProfile, focus: str) -> str:
    return (
        f"A família {family.id} demonstra potencial para {focus}; sugerimos combinar recursos comunitários e redes locais. "
        "Que apoio a família enxerga como mais urgente agora?"
    )


def _service_summary(family: FamilyProfile) -> Dict[str, str]:
    services = family.external_services
    items = []
    if services.sus.registered:
        items.append("SUS ativo")
    if services.cad_unico.registered:
        items.append("CadÚnico atualizado")
    if getattr(services.bolsa_familia, "beneficiary", False):
        items.append("Bolsa Família em uso")
    if services.others:
        items.extend(sorted({item.name for item in services.others}))
    return {
        "summary": ", ".join(items) if items else "Sem serviços ativos registrados",
        "highlight": "organizar transporte"
        if any("transporte" in entry for entry in items)
        else "fortalecer rotina escolar",
    }


def _call_openai(messages, api_key: str, model: str) -> Tuple[str, str]:
    response = requests.post(
        OPENAI_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={"model": model, "messages": messages, "temperature": 0.2, "max_tokens": 120},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        raise ValueError("Resposta vazia da API.")
    return content, model


def generate_student_insight(request: InsightStudentRequest) -> Dict[str, str]:
    student = get_student(request.student_id)
    if not student:
        raise ValueError("aluno_nao_encontrado")
    family = get_family(student.family_id)
    signals = _service_summary(family) if family else {"summary": "", "highlight": "acompanhar estudos"}

    api_key = os.getenv("OPENAI_API_KEY")
    source = "mock"
    model = "none"
    insight_text = _mock_student_insight(student, signals)

    if api_key:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Você é um assistente para coordenadores escolares; NUNCA cria diagnósticos; "
                        "use linguagem breve (1-2 frases) em PT-BR e inclua exatamente uma pergunta aberta à família."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Aluno {student.id} na zona {student.zone}. Sinais: {', '.join(student.tags)}. "
                        f"Serviços da família: {signals['summary']}. Gere insight sobre transporte, alimentação, material, saúde e apoio pedagógico, "
                        "sem atribuir culpa e convidando a família para conversar."
                    ),
                },
            ]
            insight_text, model = _call_openai(messages, api_key, DEFAULT_MODEL)
            source = "openai"
        except Exception:
            source = "fallback"
            insight_text = _mock_student_insight(student, signals)

    append_audit(
        "insight_student",
        {
            "student_id": student.id,
            "source": source,
            "model": model,
        },
    )

    return {
        "student_id": student.id,
        "insight": insight_text,
        "source": source,
        "model": model,
        "generated_at": _timestamp(),
    }


def generate_family_insight(request: InsightFamilyRequest) -> Dict[str, str]:
    family = get_family(request.family_id)
    if not family:
        raise ValueError("familia_nao_encontrada")
    signals = _service_summary(family)
    focus = "fortalecer transporte e materiais" if "transporte" in signals.get("summary", "") else "ampliar redes de apoio"

    api_key = os.getenv("OPENAI_API_KEY")
    source = "mock"
    model = "none"
    insight_text = _mock_family_insight(family, focus)

    if api_key:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Você orienta equipes intersetoriais; NUNCA fornece diagnósticos; "
                        "redija 1-2 frases em PT-BR com tom respeitoso e finalize com pergunta aberta à família."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Família {family.id} com sinais: {', '.join(family.eligibility_signals)}. "
                        f"Serviços ativos: {signals['summary']}. Sugira caminhos de apoio para transporte, material escolar, alimentação e redes comunitárias."
                    ),
                },
            ]
            insight_text, model = _call_openai(messages, api_key, DEFAULT_MODEL)
            source = "openai"
        except Exception:
            source = "fallback"
            insight_text = _mock_family_insight(family, focus)

    append_audit(
        "insight_family",
        {
            "family_id": family.id,
            "source": source,
            "model": model,
        },
    )

    return {
        "family_id": family.id,
        "insight": insight_text,
        "source": source,
        "model": model,
        "generated_at": _timestamp(),
    }


__all__ = ["generate_student_insight", "generate_family_insight"]
