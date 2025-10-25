"""Rotas para insights por aluno ou família."""

from __future__ import annotations

from fastapi import APIRouter, Body

from ..http_errors import http_error
from ..models import InsightFamilyRequest, InsightStudentRequest
from ..services.insights import generate_family_insight, generate_student_insight

router = APIRouter(tags=["insights"])


@router.post("/insights/student")
def post_student_insight(body: InsightStudentRequest = Body(...)) -> dict:
    try:
        result = generate_student_insight(body)
    except ValueError as exc:
        if str(exc) == "aluno_nao_encontrado":
            raise http_error(404, "aluno_nao_encontrado", {"student_id": body.student_id}) from exc
        raise
    return result


@router.post("/insights/family")
def post_family_insight(body: InsightFamilyRequest = Body(...)) -> dict:
    try:
        result = generate_family_insight(body)
    except ValueError as exc:
        if str(exc) == "familia_nao_encontrada":
            raise http_error(404, "familia_nao_encontrada", {"family_id": body.family_id}) from exc
        raise
    return result


__all__ = ["router"]
