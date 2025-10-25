"""Armazenamento baseado em arquivos JSON com rotinas utilitarias."""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from .models import (
    AssignmentRecord,
    ExternalServiceStatus,
    FamilyProfile,
    PersonProfile,
    RelationshipEdge,
    StudentProfile,
    VolunteerProfile,
)
from .seed_data import (
    CONFIG,
    FAMILIES,
    PERSONS,
    RELATIONSHIPS,
    SERVICES,
    STUDENTS,
    VOLUNTEERS,
    ZONES,
)
from .utils import next_id, normalize_zone_name

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_LIST_COLLECTIONS = {
    "persons": {"file": DATA_DIR / "persons.json", "root": "persons", "seed": PERSONS},
    "students": {"file": DATA_DIR / "students.json", "root": "students", "seed": STUDENTS},
    "volunteers": {
        "file": DATA_DIR / "volunteers.json",
        "root": "volunteers",
        "seed": VOLUNTEERS,
    },
    "families": {"file": DATA_DIR / "families.json", "root": "families", "seed": FAMILIES},
    "assignments": {
        "file": DATA_DIR / "assignments.json",
        "root": "assignments",
        "seed": [],
    },
    "relationships": {
        "file": DATA_DIR / "relationships.json",
        "root": "edges",
        "seed": RELATIONSHIPS,
    },
    "services": {
        "file": DATA_DIR / "services_cache.json",
        "root": "services",
        "seed": SERVICES,
    },
}

_DICT_COLLECTIONS = {
    "zones": {"file": DATA_DIR / "zones.json", "seed": {"zones": ZONES}},
    "config": {"file": DATA_DIR / "config.json", "seed": CONFIG},
}

_LOCKS = {name: threading.Lock() for name in {**_LIST_COLLECTIONS, **_DICT_COLLECTIONS}}
_AUDIT_FILE = DATA_DIR / "audit_log.jsonl"
_AUDIT_LOCK = threading.Lock()


def _timestamp() -> str:
    return datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()


def _ensure_files() -> None:
    if not _AUDIT_FILE.exists():
        _AUDIT_FILE.touch()
    for name, meta in _LIST_COLLECTIONS.items():
        file_path = meta["file"]
        if file_path.exists():
            continue
        payload = {meta["root"]: meta["seed"]}
        file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    for name, meta in _DICT_COLLECTIONS.items():
        file_path = meta["file"]
        if file_path.exists():
            continue
        file_path.write_text(json.dumps(meta["seed"], indent=2, ensure_ascii=False), encoding="utf-8")


_ensure_files()


def _read_list(name: str) -> List[dict]:
    meta = _LIST_COLLECTIONS[name]
    with _LOCKS[name]:
        raw = json.loads(meta["file"].read_text(encoding="utf-8"))
    return list(raw.get(meta["root"], []))


def _write_list(name: str, items: List[dict]) -> None:
    meta = _LIST_COLLECTIONS[name]
    payload = {meta["root"]: items}
    with _LOCKS[name]:
        meta["file"].write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _upsert(name: str, key_field: str, item: dict) -> None:
    data = _read_list(name)
    index = next((i for i, entry in enumerate(data) if entry[key_field] == item[key_field]), None)
    if index is None:
        data.append(item)
    else:
        data[index] = item
    data.sort(key=lambda entry: entry[key_field])
    _write_list(name, data)


def _remove(name: str, key_field: str, value: str) -> None:
    data = [entry for entry in _read_list(name) if entry.get(key_field) != value]
    _write_list(name, data)


def resolve_zone(zone: str) -> str:
    """Retorna o nome canônico da zona ignorando espaços e caixa."""
    if not zone:
        raise ValueError("zona_obrigatoria")
    normalized = normalize_zone_name(zone)
    zones = fetch_zones()
    for canonical in zones.keys():
        if normalize_zone_name(canonical) == normalized:
            return canonical
    raise ValueError("zona_invalida")


def list_persons() -> List[PersonProfile]:
    return [PersonProfile(**row) for row in _read_list("persons")]


def get_person(person_id: str) -> Optional[PersonProfile]:
    for row in _read_list("persons"):
        if row["id"] == person_id:
            return PersonProfile(**row)
    return None


def upsert_person(person: PersonProfile) -> None:
    _upsert("persons", "id", person.model_dump())


def list_students(zone: Optional[str] = None) -> List[StudentProfile]:
    items = [StudentProfile(**row) for row in _read_list("students")]
    if zone:
        canonical = resolve_zone(zone)
        return [student for student in items if student.zone == canonical]
    return items


def get_student(student_id: str) -> Optional[StudentProfile]:
    for row in _read_list("students"):
        if row["id"] == student_id:
            return StudentProfile(**row)
    return None


def upsert_student(student: StudentProfile) -> None:
    _upsert("students", "id", student.model_dump())


def list_volunteers(zone: Optional[str] = None) -> List[VolunteerProfile]:
    items = [VolunteerProfile(**row) for row in _read_list("volunteers")]
    if zone:
        canonical = resolve_zone(zone)
        return [vol for vol in items if vol.zone == canonical]
    return items


def get_volunteer(volunteer_id: str) -> Optional[VolunteerProfile]:
    for row in _read_list("volunteers"):
        if row["id"] == volunteer_id:
            return VolunteerProfile(**row)
    return None


def upsert_volunteer(volunteer: VolunteerProfile) -> None:
    _upsert("volunteers", "id", volunteer.model_dump())


def list_families(zone: Optional[str] = None) -> List[FamilyProfile]:
    families = [FamilyProfile(**row) for row in _read_list("families")]
    if not zone:
        return families
    family_ids = {student.family_id for student in list_students(zone=zone)}
    return [family for family in families if family.id in family_ids]


def get_family(family_id: str) -> Optional[FamilyProfile]:
    for row in _read_list("families"):
        if row["id"] == family_id:
            return FamilyProfile(**row)
    return None


def upsert_family(family: FamilyProfile) -> None:
    _upsert("families", "id", family.model_dump())


def list_relationships() -> List[RelationshipEdge]:
    return [RelationshipEdge(**row) for row in _read_list("relationships")]


def upsert_relationship(edge: RelationshipEdge) -> None:
    _upsert("relationships", "id", edge.model_dump())


def list_services_cache() -> List[ExternalServiceStatus]:
    return [ExternalServiceStatus(**row) for row in _read_list("services")]


def upsert_service_cache(entry: ExternalServiceStatus) -> None:
    _upsert("services", "id", entry.model_dump())


def list_assignments(zone: Optional[str] = None) -> List[AssignmentRecord]:
    items = [AssignmentRecord(**row) for row in _read_list("assignments")]
    if zone:
        canonical = resolve_zone(zone)
        return [assignment for assignment in items if assignment.zone == canonical]
    return items


def append_assignment(record: AssignmentRecord) -> None:
    data = [row for row in _read_list("assignments") if row["student_id"] != record.student_id]
    data.append(record.model_dump())
    data.sort(key=lambda row: row["student_id"])
    _write_list("assignments", data)


def remove_assignments_for_student(student_id: str) -> None:
    _remove("assignments", "student_id", student_id)


def fetch_zones() -> Dict[str, Dict[str, float]]:
    meta = _DICT_COLLECTIONS["zones"]
    with _LOCKS["zones"]:
        payload = json.loads(meta["file"].read_text(encoding="utf-8"))
    return payload.get("zones", {})


def fetch_config() -> Dict[str, float]:
    meta = _DICT_COLLECTIONS["config"]
    with _LOCKS["config"]:
        payload = json.loads(meta["file"].read_text(encoding="utf-8"))
    return payload


def append_audit(action: str, payload: dict) -> None:
    event = {"timestamp": _timestamp(), "action": action, "payload": payload}
    with _AUDIT_LOCK:
        with _AUDIT_FILE.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False))
            handle.write("\n")


def generate_id(prefix: str, existing: Iterable[str]) -> str:
    return next_id(prefix, existing)


__all__ = [
    "append_audit",
    "append_assignment",
    "fetch_config",
    "fetch_zones",
    "generate_id",
    "get_family",
    "get_person",
    "get_student",
    "get_volunteer",
    "list_assignments",
    "list_families",
    "list_persons",
    "list_relationships",
    "list_services_cache",
    "list_students",
    "list_volunteers",
    "resolve_zone",
    "remove_assignments_for_student",
    "upsert_family",
    "upsert_person",
    "upsert_relationship",
    "upsert_service_cache",
    "upsert_student",
    "upsert_volunteer",
]
