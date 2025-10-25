"""Rotas para atribuicoes aluno-voluntario."""

from __future__ import annotations

from fastapi import APIRouter, Body, Query

from ..http_errors import http_error
from ..models import AssignmentRequest
from ..services.assignment import assign_students
from ..storage import list_assignments, resolve_zone

router = APIRouter(tags=["assignments"])


def _resolve_zone(zone: str) -> str:
    try:
        return resolve_zone(zone)
    except ValueError as exc:
        message = str(exc)
        if message == "zona_obrigatoria":
            raise http_error(400, message)
        raise http_error(400, "zona_invalida", {"zone": zone})


@router.post("/assign")
def post_assign(request: AssignmentRequest = Body(default_factory=AssignmentRequest)) -> dict:
    try:
        return assign_students(request)
    except ValueError as exc:
        message = str(exc)
        if message == "zona_invalida":
            raise http_error(400, "zona_invalida", {"zone": request.zone}) from exc
        if message == "zona_obrigatoria":
            raise http_error(400, "zona_obrigatoria") from exc
        raise


@router.get("/assignments")
def get_assignments(zone: str | None = Query(default=None, description="Filtrar por zona.")) -> dict:
    canonical_zone = _resolve_zone(zone) if zone else None
    assignments = list_assignments(zone=canonical_zone if canonical_zone else None)
    return {
        "assignments": [assignment.model_dump() for assignment in assignments],
        "explanation": "Histórico de atribuições realizadas no ambiente mock.",
    }


__all__ = ["router"]
