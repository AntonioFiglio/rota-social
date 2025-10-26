"""Servicos de sincronizacao de alunos e perfis familiares mock."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Set, Tuple

from ..constants import (
    ELIGIBILITY_BAIXA_RENDA,
    ELIGIBILITY_FAMILIA_MONOPARENTAL,
    ELIGIBILITY_NECESSIDADE_MOBILIDADE,
    ELIGIBILITY_RESPONSAVEL_IDOSO,
)
from ..models import (
    ExternalServiceFootprint,
    ExternalServiceItem,
    ExternalServiceStatus,
    FamilyConsent,
    FamilyExternalServices,
    FamilyHouseholdMember,
    FamilyProfile,
    PersonProfile,
    RecordLinkage,
    RelationshipEdge,
    StudentAttendance,
    StudentDisabilities,
    StudentProfile,
    StudentSchool,
)
from ..storage import (
    append_audit,
    fetch_config,
    fetch_zones,
    generate_id,
    get_family,
    list_families,
    list_persons,
    list_relationships,
    list_services_cache,
    list_students,
    resolve_zone,
    upsert_family,
    upsert_person,
    upsert_relationship,
    upsert_service_cache,
    upsert_student,
)
from ..utils.names import generate_guardian_name, generate_student_name


ZONE_META = {
    "Sao Paulo": {"city": "São Paulo", "state": "SP", "postal_code": "01000-000"},
    "Franca": {"city": "Franca", "state": "SP", "postal_code": "14400-000"},
    "Goiania": {"city": "Goiânia", "state": "GO", "postal_code": "74000-000"},
}

SCHOOL_MAP = {
    "Sao Paulo": {"school_id": "ESC701", "school_name": "EE Zona Centro"},
    "Franca": {"school_id": "ESC702", "school_name": "EE Franca Norte"},
    "Goiania": {"school_id": "ESC703", "school_name": "EM Goiânia Leste"},
}


def _timestamp() -> str:
    return datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()


def _reserve_id(prefix: str, known: Set[str]) -> str:
    new_id = generate_id(prefix, known)
    known.add(new_id)
    return new_id


def _base_coordinates(zone: str, index: int, lat: float, lon: float) -> Tuple[float, float]:
    shift_lat = ((index % 3) - 1) * 0.0015
    shift_lon = ((index % 4) - 1) * 0.0013
    return (round(lat + shift_lat, 6), round(lon + shift_lon, 6))


def _build_person(
    *,
    person_id: str,
    full_name: str,
    preferred: str,
    gender: str,
    zone: str,
    is_guardian: bool,
    index: int,
    lat: float,
    lon: float,
) -> PersonProfile:
    meta = ZONE_META[zone]
    street = f"Rua {zone} {index + 1}"
    coordinates = _base_coordinates(zone, index, lat, lon)
    document_type = "RG" if is_guardian else "RM"
    document_number = f"{zone[:2].upper()}-{person_id[1:]}"
    contacts = {
        "phone": f"+55 99 9{(index + 1000):04d}-0000",
        "email": f"{person_id.lower()}@example.com",
        "preferred_channel": "whatsapp" if index % 2 == 0 else "telefone",
    }
    vulnerability = {
        "elderly": is_guardian and index % 4 == 0,
        "single_parent": is_guardian and index % 3 == 0,
        "low_income": True,
    }
    tags = ["responsavel", "sync_mock"] if is_guardian else ["student", "sync_mock"]
    return PersonProfile(
        id=person_id,
        name=full_name,
        preferred_name=preferred,
        document={"type": document_type, "number": document_number},
        birthdate="1965-05-10" if is_guardian else "2012-08-15",
        gender=gender,
        profession="trabalhador autônomo" if is_guardian else "estudante",
        address={
            "street": street,
            "number": str(100 + index),
            "complement": "Casa",
            "neighborhood": "Centro",
            "city": meta["city"],
            "state": meta["state"],
            "postal_code": meta["postal_code"],
        },
        contacts=contacts,
        coordinates={"latitude": coordinates[0], "longitude": coordinates[1]},
        vulnerability_flags=vulnerability,
        tags=tags,
    )


def _build_student_profile(
    student_id: str,
    person_id: str,
    family_id: str,
    zone: str,
    index: int,
    lat: float,
    lon: float,
) -> StudentProfile:
    coordinates = _base_coordinates(zone, index + 1, lat, lon)
    school_info = SCHOOL_MAP[zone]
    grade_cycle = ["5º ano", "6º ano", "7º ano", "8º ano", "9º ano"]
    grade = grade_cycle[index % len(grade_cycle)]
    shift = "manhã" if index % 2 == 0 else "tarde"
    return StudentProfile(
        id=student_id,
        person_id=person_id,
        family_id=family_id,
        zone=zone,
        school=StudentSchool(
            school_id=school_info["school_id"],
            school_name=school_info["school_name"],
            grade=grade,
            classroom=f"{grade[:2]}-{chr(65 + (index % 3))}",
            shift=shift,
            enrollment_status="ativo",
        ),
        attendance_last_30d=StudentAttendance(absences=index % 3, delays=index % 2),
        disabilities=StudentDisabilities(wheelchair_user=index % 4 == 0),
        warm_notes=f"Aluno gerado via sync mock para a zona {zone}.",
        coordinates={"latitude": coordinates[0], "longitude": coordinates[1]},
        tags=["sync", zone.lower()],
    )


def _compose_service_package(family_id: str, zone: str, timestamp: str) -> Tuple[
    FamilyExternalServices,
    List[str],
    str,
    float,
    List[str],
    List[str],
    List[Tuple[str, dict]],
]:
    seed = sum(ord(char) for char in f"{family_id}{zone}")
    sus_registered = seed % 3 != 0
    cad_registered = seed % 2 == 0
    bolsa_beneficiary = seed % 5 == 0
    services = FamilyExternalServices(
        sus=ExternalServiceFootprint(
            registered=sus_registered,
            unit=f"UBS {zone} Central",
            last_update=timestamp,
        ),
        cad_unico=ExternalServiceFootprint(
            registered=cad_registered,
            nis=f"{seed:011d}" if cad_registered else None,
            last_update=timestamp,
        ),
        bolsa_familia=ExternalServiceFootprint(
            registered=bolsa_beneficiary,
            beneficiary=bolsa_beneficiary,
            status="ativo" if bolsa_beneficiary else "avaliacao",
            last_update=timestamp,
        ),
        others=[
            ExternalServiceItem(name="transporte_escolar", active=seed % 2 == 0),
            ExternalServiceItem(name="programa_alimentacao", active=seed % 4 == 0),
        ],
    )

    eligibility = {ELIGIBILITY_BAIXA_RENDA}
    if seed % 5 == 0:
        eligibility.add(ELIGIBILITY_RESPONSAVEL_IDOSO)
    if seed % 3 == 0:
        eligibility.add(ELIGIBILITY_FAMILIA_MONOPARENTAL)
    if seed % 7 == 0:
        eligibility.add(ELIGIBILITY_NECESSIDADE_MOBILIDADE)
    warm_notes = f"Perfil familiar {family_id} enriquecido com indicadores simulados para {zone}."
    confidence = round(min(0.99, 0.8 + (seed % 15) / 100), 2)
    inputs = ["SED", "SUS", "CadÚnico", "Bolsa Família"]
    explanations = [f"Dados mock conciliados para a zona {zone}."]
    status_payloads = [
        ("sus", {"registered": services.sus.registered, "unit": services.sus.unit}),
        ("cad_unico", {"registered": services.cad_unico.registered, "nis": services.cad_unico.nis}),
        (
            "bolsa_familia",
            {
                "beneficiary": services.bolsa_familia.beneficiary,
                "status": services.bolsa_familia.status,
            },
        ),
        (
            "outro",
            {
                "services": [item.name for item in services.others if item.active],
            },
        ),
    ]
    return (
        services,
        sorted(eligibility),
        warm_notes,
        confidence,
        inputs,
        explanations,
        status_payloads,
    )


def _upsert_services_cache(
    *,
    family_id: str,
    timestamp: str,
    entries: List[Tuple[str, dict]],
    service_index: Dict[Tuple[str, str], ExternalServiceStatus],
    service_ids: Set[str],
) -> None:
    for source, payload in entries:
        existing = service_index.get((family_id, source))
        if existing:
            service_id = existing.id
        else:
            service_id = _reserve_id("SV", service_ids)
        record = ExternalServiceStatus(
            id=service_id,
            family_id=family_id,
            source=source,
            payload=payload,
            fetched_at=timestamp,
        )
        upsert_service_cache(record)
        service_index[(family_id, source)] = record


def _ensure_relationship(
    *,
    guardian_id: str,
    student_person_id: str,
    relation_ids: Set[str],
    relation_index: Dict[Tuple[str, str, str], RelationshipEdge],
) -> None:
    key = (guardian_id, student_person_id, "guardian_of")
    if key in relation_index:
        return
    edge_id = _reserve_id("E", relation_ids)
    edge = RelationshipEdge(
        id=edge_id,
        from_person_id=guardian_id,
        to_person_id=student_person_id,
        type="guardian_of",
        weight=1.0,
    )
    upsert_relationship(edge)
    relation_index[key] = edge


def sync_zone_students(zone: str) -> Dict[str, object]:
    try:
        canonical_zone = resolve_zone(zone)
    except ValueError as exc:
        raise ValueError(str(exc)) from exc
    zones = fetch_zones()

    config = fetch_config()
    min_students = int(config.get("min_students_per_zone_after_sync", 5))
    base_lat = zones[canonical_zone]["lat"]
    base_lon = zones[canonical_zone]["lon"]
    timestamp = _timestamp()

    persons = list_persons()
    families = list_families()
    relationships = list_relationships()
    services_cache = list_services_cache()

    person_ids = {item.id for item in persons}
    family_ids = {item.id for item in families}
    student_ids = {student.id for student in list_students()}
    relation_ids = {edge.id for edge in relationships}
    relation_index = {
        (edge.from_person_id, edge.to_person_id, edge.type): edge for edge in relationships
    }
    service_ids = {entry.id for entry in services_cache}
    service_index = {
        (entry.family_id, entry.source): entry for entry in services_cache
    }

    existing_zone_students = list_students(zone=canonical_zone)
    needed = max(0, min_students - len(existing_zone_students))
    added_students: List[StudentProfile] = []
    touched_families: Set[str] = set()

    for offset in range(needed):
        base_index = len(existing_zone_students) + len(added_students) + offset
        guardian_id = _reserve_id("P", person_ids)
        guardian_name, guardian_preferred, guardian_gender = generate_guardian_name(base_index + 1)
        guardian = _build_person(
            person_id=guardian_id,
            full_name=guardian_name,
            preferred=guardian_preferred,
            gender=guardian_gender,
            zone=canonical_zone,
            is_guardian=True,
            index=base_index,
            lat=base_lat,
            lon=base_lon,
        )
        upsert_person(guardian)

        student_person_id = _reserve_id("P", person_ids)
        student_name, student_preferred, student_gender = generate_student_name(base_index + 1)
        student_person = _build_person(
            person_id=student_person_id,
            full_name=student_name,
            preferred=student_preferred,
            gender=student_gender,
            zone=canonical_zone,
            is_guardian=False,
            index=base_index,
            lat=base_lat,
            lon=base_lon,
        )
        upsert_person(student_person)

        family_id = _reserve_id("F", family_ids)
        services, eligibility, warm_notes, confidence, inputs, explanations, cache_entries = _compose_service_package(
            family_id, canonical_zone, timestamp
        )
        family = FamilyProfile(
            id=family_id,
            household=[
                FamilyHouseholdMember(person_id=guardian_id, role="guardian"),
                FamilyHouseholdMember(person_id=student_person_id, role="student"),
            ],
            external_services=services,
            eligibility_signals=eligibility,
            consent=FamilyConsent(family_granted=True, updated_at=timestamp),
            record_linkage=RecordLinkage(inputs=inputs, confidence=confidence, explanations=explanations),
            warm_notes=warm_notes,
        )
        upsert_family(family)
        touched_families.add(family_id)

        _upsert_services_cache(
            family_id=family_id,
            timestamp=timestamp,
            entries=cache_entries,
            service_index=service_index,
            service_ids=service_ids,
        )

        student_id = _reserve_id("S", student_ids)
        student_profile = _build_student_profile(
            student_id=student_id,
            person_id=student_person_id,
            family_id=family_id,
            zone=canonical_zone,
            index=base_index,
            lat=base_lat,
            lon=base_lon,
        )
        upsert_student(student_profile)
        added_students.append(student_profile)
        _ensure_relationship(
            guardian_id=guardian_id,
            student_person_id=student_person_id,
            relation_ids=relation_ids,
            relation_index=relation_index,
        )

    # Recalcula lista apos insercoes
    zone_students = list_students(zone=canonical_zone)
    for student in zone_students:
        family = get_family(student.family_id)
        if family is None:
            # Se nao existir, cria estrutura minima
            family_id = student.family_id
            services, eligibility, warm_notes, confidence, inputs, explanations, cache_entries = _compose_service_package(
                family_id, canonical_zone, timestamp
            )
            new_family = FamilyProfile(
                id=family_id,
                household=[
                    FamilyHouseholdMember(person_id=student.person_id, role="student"),
                ],
                external_services=services,
                eligibility_signals=eligibility,
                consent=FamilyConsent(family_granted=True, updated_at=timestamp),
                record_linkage=RecordLinkage(inputs=inputs, confidence=confidence, explanations=explanations),
                warm_notes=warm_notes,
            )
            upsert_family(new_family)
            family = new_family
        else:
            services, eligibility, warm_notes, confidence, inputs, explanations, cache_entries = _compose_service_package(
                family.id, canonical_zone, timestamp
            )
            family_dict = family.model_dump()
            family_dict["external_services"] = services.model_dump()
            family_dict["eligibility_signals"] = eligibility
            family_dict["warm_notes"] = warm_notes
            consent = family_dict.get("consent", {})
            consent["family_granted"] = consent.get("family_granted", True)
            consent["updated_at"] = timestamp
            family_dict["consent"] = consent
            record_linkage = family_dict.get("record_linkage", {})
            record_linkage["inputs"] = inputs
            record_linkage["confidence"] = confidence
            record_linkage["explanations"] = explanations
            family_dict["record_linkage"] = record_linkage
            updated_family = FamilyProfile(**family_dict)
            upsert_family(updated_family)
            family = updated_family

        touched_families.add(family.id)
        _upsert_services_cache(
            family_id=family.id,
            timestamp=timestamp,
            entries=cache_entries,
            service_index=service_index,
            service_ids=service_ids,
        )

    append_audit(
        "sync_students",
        {
            "zone": zone,
            "added": [student.id for student in added_students],
            "families": sorted(touched_families),
        },
    )

    return {
        "zone": canonical_zone,
        "added_students": [student.model_dump() for student in added_students],
        "touched_families": sorted(touched_families),
        "explanation": "Dados fictícios gerados e FamilyProfile enriquecido com SUS/CadÚnico/Bolsa Família (mock). Nenhum dado real foi usado.",
    }


__all__ = ["sync_zone_students"]
