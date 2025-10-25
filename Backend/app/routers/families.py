"""Rotas para consulta de perfis familiares."""

from __future__ import annotations

from fastapi import APIRouter, Path, Query

from ..http_errors import http_error
from ..storage import get_family, list_families, resolve_zone

router = APIRouter(tags=["families"])


def _resolve_zone(zone: str) -> str:
    try:
        return resolve_zone(zone)
    except ValueError as exc:
        message = str(exc)
        if message == "zona_obrigatoria":
            raise http_error(400, message)
        raise http_error(400, "zona_invalida", {"zone": zone})


@router.get("/families")
def get_families(zone: str | None = Query(default=None, description="Zona a filtrar.")) -> dict:
    canonical_zone = _resolve_zone(zone) if zone else None
    families = list_families(zone=canonical_zone if canonical_zone else None)
    return {
        "families": [family.model_dump() for family in families],
        "explanation": "Perfis familiares com dados mockados e enriquecimento de serviços.",
    }


@router.get("/family/{family_id}")
def get_family_profile(family_id: str = Path(..., description="Identificador da família.")) -> dict:
    family = get_family(family_id)
    if not family:
        raise http_error(404, "familia_nao_encontrada", {"family_id": family_id})
    return {
        "family": family.model_dump(),
        "explanation": "Perfil familiar agregado com serviços públicos simulados.",
    }


__all__ = ["router"]
