"""Rotas para voluntarios e webhook de cadastro."""

from __future__ import annotations

from fastapi import APIRouter, Body, Query

from ..http_errors import http_error
from ..models import VolunteerProfile, VolunteerUpsert
from ..storage import (
    append_audit,
    fetch_config,
    generate_id,
    list_volunteers,
    resolve_zone,
    upsert_volunteer,
)

router = APIRouter(tags=["volunteers"])


def _resolve_zone(zone: str) -> str:
    try:
        return resolve_zone(zone)
    except ValueError as exc:
        message = str(exc)
        if message == "zona_obrigatoria":
            raise http_error(400, message)
        raise http_error(400, "zona_invalida", {"zone": zone})


@router.get("/volunteers")
def get_volunteers(zone: str | None = Query(default=None, description="Filtrar por zona.")) -> dict:
    canonical_zone = _resolve_zone(zone) if zone else None
    volunteers = list_volunteers(zone=canonical_zone if canonical_zone else None)
    return {
        "volunteers": [volunteer.model_dump() for volunteer in volunteers],
        "explanation": "Lista de voluntários mock para apoio acadêmico.",
    }


@router.post("/webhook/volunteers")
def webhook_volunteers(payload: VolunteerUpsert = Body(...)) -> dict:
    canonical_zone = _resolve_zone(payload.zone)
    config = fetch_config()
    existing_ids = {vol.id for vol in list_volunteers()}
    volunteer_id = payload.id or generate_id("V", existing_ids)
    if payload.id and payload.id in existing_ids:
        volunteer_id = generate_id("V", existing_ids)

    max_students = payload.max_students if payload.max_students is not None else int(config.get("max_students_default", 10))
    radius_km = payload.radius_km if payload.radius_km is not None else float(config.get("max_radius_km", 8.0))
    verified = payload.verified if payload.verified is not None else False
    profile = VolunteerProfile(
        id=volunteer_id,
        name=payload.name,
        zone=canonical_zone,
        address=payload.address,
        contact=payload.contact,
        coordinates=payload.coordinates,
        max_students=max_students,
        radius_km=radius_km,
        availability=payload.availability,
        skills=payload.skills,
        languages=payload.languages,
        experience_years=payload.experience_years or 0,
        accessibility=payload.accessibility,
        verified=verified,
        warm_notes=payload.warm_notes,
        tags=payload.tags,
    )
    upsert_volunteer(profile)

    append_audit(
        "webhook_volunteer",
        {"volunteer_id": profile.id, "zone": profile.zone},
    )

    return {"message": "volunteer_saved", "volunteer": profile.model_dump()}


__all__ = ["router"]
