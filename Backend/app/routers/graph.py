"""Rotas para grafos sociais simples."""

from __future__ import annotations

from fastapi import APIRouter, Path

from ..http_errors import http_error
from ..storage import (
    get_family,
    get_person,
    get_student,
    list_assignments,
    list_relationships,
    list_volunteers,
)

router = APIRouter(tags=["graph"])


@router.get("/network/student/{student_id}")
def get_student_network(student_id: str = Path(..., description="Identificador do aluno.")) -> dict:
    student = get_student(student_id)
    if not student:
        raise http_error(404, "aluno_nao_encontrado", {"student_id": student_id})

    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    def add_node(node_id: str, data: dict) -> None:
        nodes.setdefault(node_id, {"id": node_id, **data})

    add_node(
        student.id,
        {
            "type": "student",
            "label": student.id,
            "zone": student.zone,
            "tags": student.tags,
        },
    )

    student_person = get_person(student.person_id)
    if student_person:
        add_node(
            student_person.id,
            {
                "type": "person",
                "label": student_person.name,
                "preferred_name": student_person.preferred_name,
                "tags": student_person.tags,
            },
        )
        edges.append(
            {
                "id": f"E{student_person.id}{student.id}",
                "from": student_person.id,
                "to": student.id,
                "type": "self_profile",
            }
        )

    family = get_family(student.family_id)
    if family:
        add_node(
            family.id,
            {
                "type": "family",
                "label": family.id,
                "eligibility": family.eligibility_signals,
            },
        )
        edges.append(
            {
                "id": f"E{student.id}{family.id}",
                "from": student.id,
                "to": family.id,
                "type": "member_of",
            }
        )
        for member in family.household:
            person = get_person(member.person_id)
            if not person:
                continue
            add_node(
                person.id,
                {
                    "type": "person",
                    "label": person.name,
                    "preferred_name": person.preferred_name,
                    "tags": person.tags,
                },
            )
            edges.append(
                {
                    "id": f"E{family.id}{person.id}",
                    "from": family.id,
                    "to": person.id,
                    "type": member.role,
                }
            )

    relationships = list_relationships()
    for relation in relationships:
        if relation.to_person_id == student.person_id:
            guardian = get_person(relation.from_person_id)
            if guardian:
                add_node(
                    guardian.id,
                    {
                        "type": "person",
                        "label": guardian.name,
                        "preferred_name": guardian.preferred_name,
                        "tags": guardian.tags,
                    },
                )
            edges.append(
                {
                    "id": relation.id,
                    "from": relation.from_person_id,
                    "to": relation.to_person_id,
                    "type": relation.type,
                    "weight": relation.weight,
                }
            )

    # Voluntario atribuido se existir
    assignment = next((item for item in list_assignments() if item.student_id == student.id), None)
    if assignment:
        volunteer = next((vol for vol in list_volunteers() if vol.id == assignment.volunteer_id), None)
        if volunteer:
            add_node(
                volunteer.id,
                {
                    "type": "volunteer",
                    "label": volunteer.name,
                    "zone": volunteer.zone,
                    "skills": volunteer.skills,
                },
            )
        edges.append(
            {
                "id": f"assign-{assignment.student_id}-{assignment.volunteer_id}",
                "from": assignment.student_id,
                "to": assignment.volunteer_id,
                "type": "assigned_to",
                "distance_km": assignment.distance_km,
            }
        )

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "explanation": "Grafo social simplificado conectando aluno, família e voluntário (quando disponível).",
    }


__all__ = ["router"]
