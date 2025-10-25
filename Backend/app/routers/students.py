"""Rotas relacionadas a alunos e sincronizacao."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..http_errors import http_error
from ..services.sync import sync_zone_students
from ..storage import list_students, resolve_zone

router = APIRouter(tags=["students"])


def _resolve_zone(zone: str) -> str:
    try:
        return resolve_zone(zone)
    except ValueError as exc:
        message = str(exc)
        if message == "zona_obrigatoria":
            raise http_error(400, message)
        raise http_error(400, "zona_invalida", {"zone": zone})


@router.get("/students")
def get_students(zone: str | None = Query(default=None, description="Filtrar por zona.")) -> dict:
    canonical_zone = _resolve_zone(zone) if zone else None
    students = list_students(zone=canonical_zone if canonical_zone else None)
    return {
        "students": [student.model_dump() for student in students],
        "explanation": "Listagem de estudantes mock filtrada por zona quando informado.",
    }


@router.get("/sync/students")
def sync_students(zone: str = Query(description="Nome exato da zona (obrigatória).")) -> dict:
    if not zone:
        raise http_error(400, "zona_obrigatoria")
    canonical = _resolve_zone(zone)
    return sync_zone_students(canonical)


__all__ = ["router"]
