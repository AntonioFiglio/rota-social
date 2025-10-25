"""Servicos de distribuicao de alunos para voluntarios."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from ..models import AssignmentRecord, AssignmentRequest, StudentProfile, VolunteerProfile
from ..storage import (
    append_assignment,
    append_audit,
    fetch_config,
    list_assignments,
    list_students,
    list_volunteers,
    resolve_zone,
)
from ..utils.geo import haversine_km


def _radius_limits(volunteer: VolunteerProfile, request_radius: Optional[float], config_radius: float) -> float:
    limit = min(volunteer.radius_km, config_radius)
    if request_radius is not None:
        limit = min(limit, request_radius)
    return limit


def _load_maps() -> Tuple[Dict[str, int], Dict[str, AssignmentRecord]]:
    load: Dict[str, int] = {}
    assignments_by_student: Dict[str, AssignmentRecord] = {}
    for record in list_assignments():
        load[record.volunteer_id] = load.get(record.volunteer_id, 0) + 1
        assignments_by_student[record.student_id] = record
    return load, assignments_by_student


def _volunteer_summary(volunteers: List[VolunteerProfile], load_map: Dict[str, int]) -> List[dict]:
    summary = []
    for volunteer in volunteers:
        summary.append(
            {
                "volunteer_id": volunteer.id,
                "zone": volunteer.zone,
                "assigned": load_map.get(volunteer.id, 0),
                "capacity": volunteer.max_students,
            }
        )
    return summary


def _build_rationale(student: StudentProfile, volunteer: VolunteerProfile, distance: float, fallback: bool) -> str:
    prefix = "Aluno com necessidade de mobilidade" if student.disabilities.wheelchair_user else "Aluno sem restricao de mobilidade"
    core = f"Distância aproximada de {distance} km até o voluntário {volunteer.id}."
    if fallback and student.disabilities.wheelchair_user:
        return (
            f"{prefix}; voluntário sem mobilidade assistida disponível no raio, selecionado o mais próximo. {core}"
        )
    if student.disabilities.wheelchair_user and volunteer.accessibility.mobility_assistance:
        return f"{prefix}; voluntário com mobilidade assistida selecionado. {core}"
    return f"{prefix}. {core}"


def assign_students(request: AssignmentRequest) -> Dict[str, List[dict]]:
    config = fetch_config()
    canonical_zone: Optional[str] = None
    if request.zone:
        try:
            canonical_zone = resolve_zone(request.zone)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc

    load_map, existing_by_student = _load_maps()
    all_students = list_students(zone=canonical_zone)
    students_to_assign = [student for student in all_students if student.id not in existing_by_student]

    assigned: List[dict] = []
    unassigned: List[dict] = []
    touched_volunteers: Dict[str, VolunteerProfile] = {}

    volunteer_pool = list_volunteers(zone=canonical_zone) if canonical_zone else list_volunteers()

    for student in students_to_assign:
        zone_volunteers = [vol for vol in volunteer_pool if vol.zone == student.zone]
        if not zone_volunteers:
            unassigned.append({"student_id": student.id, "reason": "no_match"})
            continue

        capacity_candidates = [vol for vol in zone_volunteers if load_map.get(vol.id, 0) < vol.max_students]
        if not capacity_candidates:
            unassigned.append({"student_id": student.id, "reason": "no_capacity"})
            continue

        radius_limit_candidates: List[Tuple[VolunteerProfile, float]] = []
        for volunteer in capacity_candidates:
            limit = _radius_limits(volunteer, request.max_radius_km, config.get("max_radius_km", 8.0))
            distance = haversine_km(
                student.coordinates.latitude,
                student.coordinates.longitude,
                volunteer.coordinates.latitude,
                volunteer.coordinates.longitude,
            )
            if distance <= limit:
                radius_limit_candidates.append((volunteer, distance))

        if not radius_limit_candidates:
            unassigned.append({"student_id": student.id, "reason": "no_within_radius"})
            continue

        requires_access = student.disabilities.wheelchair_user
        accessible = [item for item in radius_limit_candidates if item[0].accessibility.mobility_assistance]
        fallback_access = False
        candidate_pool = accessible if requires_access and accessible else radius_limit_candidates
        if requires_access and not accessible:
            fallback_access = True

        candidate_pool.sort(
            key=lambda data: (
                data[1],
                load_map.get(data[0].id, 0),
                data[0].id,
            )
        )
        volunteer, distance = candidate_pool[0]
        load_map[volunteer.id] = load_map.get(volunteer.id, 0) + 1
        touched_volunteers[volunteer.id] = volunteer

        rationale = _build_rationale(student, volunteer, distance, fallback_access)
        record = AssignmentRecord(
            student_id=student.id,
            volunteer_id=volunteer.id,
            zone=student.zone,
            distance_km=distance,
            rationale=rationale,
            created_at=_timestamp(),
        )
        append_assignment(record)
        assigned.append(
            {
                "student_id": student.id,
                "volunteer_id": volunteer.id,
                "distance_km": distance,
                "rationale": rationale,
            }
        )

    summary = _volunteer_summary(list(touched_volunteers.values()) or volunteer_pool, load_map)
    append_audit(
        "assign",
        {
        "requested_zone": canonical_zone,
            "assigned": [item["student_id"] for item in assigned],
            "unassigned": unassigned,
        },
    )

    return {
        "assigned": assigned,
        "unassigned": unassigned,
        "summary": summary,
        "explanation": "Matching por zona, menor distância e regra simples de acessibilidade.",
    }


def _timestamp() -> str:
    return datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()


__all__ = ["assign_students"]
