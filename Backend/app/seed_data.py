"""Geracao deterministica de seeds (>=3000 alunos) para os arquivos JSON."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from random import Random
from typing import Dict, List, Tuple

TOTAL_STUDENTS = 3000
VOLUNTEERS_PER_ZONE = 120
TIMESTAMP = datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()

ZONES: Dict[str, Dict[str, float]] = {
    "Sao Paulo": {"lat": -23.5505, "lon": -46.6333},
    "Franca": {"lat": -20.5386, "lon": -47.4009},
    "Goiania": {"lat": -16.6869, "lon": -49.2648},
}

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

STUDENT_NAMES = [
    "Alex",
    "Bianca",
    "Caio",
    "Daniela",
    "Eduarda",
    "Felipe",
    "Gabriela",
    "Henrique",
    "Isabela",
    "João",
    "Karen",
    "Larissa",
    "Miguel",
    "Natan",
    "Olivia",
    "Paulo",
    "Rafaela",
    "Sofia",
    "Tiago",
    "Vitória",
]

GUARDIAN_NAMES = [
    "Ana",
    "Bruno",
    "Claudia",
    "Diego",
    "Eva",
    "Fernando",
    "Gisele",
    "Heloisa",
    "Igor",
    "Janaina",
    "Kleber",
    "Larissa",
    "Marcelo",
    "Natalia",
    "Otavio",
    "Patricia",
    "Renato",
    "Silvia",
    "Talita",
    "Valter",
]

VOLUNTEER_NAMES = [
    "Bruna Lima",
    "Carlos Nunes",
    "Renata Faria",
    "Eduardo Prado",
    "Fernanda Silva",
    "Hugo Martins",
    "Isis Carvalho",
    "Lia Monteiro",
    "Marcos Teixeira",
    "Nina Barbosa",
]

SKILL_POOL = [
    "reforço português",
    "matemática básica",
    "ciências",
    "leitura orientada",
    "artes",
    "tecnologia",
]

WEEKDAY_OPTIONS = [
    ["mon", "wed"],
    ["tue", "thu"],
    ["sat"],
    ["mon", "thu", "sat"],
]

TIME_SLOT_OPTIONS = [
    ["morning"],
    ["afternoon"],
    ["evening"],
    ["morning", "afternoon"],
]

CONFIG: Dict[str, float] = {
    "max_students_default": 10,
    "max_radius_km": 8.0,
    "min_students_per_zone_after_sync": 5,
}


@dataclass
class SeedData:
    persons: List[dict]
    students: List[dict]
    volunteers: List[dict]
    families: List[dict]
    relationships: List[dict]
    services: List[dict]


def _format_id(prefix: str, index: int) -> str:
    return f"{prefix}{index:04d}"


def _birthdate(year_start: int, offset: int) -> str:
    year = year_start + (offset % 28)
    month = (offset % 12) + 1
    day = (offset % 27) + 1
    return f"{year:04d}-{month:02d}-{day:02d}"


def _compose_services(family_id: str, zone: str) -> Tuple[dict, List[Tuple[str, dict]]]:
    seed = int(family_id[1:])
    sus_registered = seed % 3 != 0
    cad_registered = seed % 2 == 0
    bolsa_beneficiary = seed % 5 == 0

    services = {
        "sus": {
            "registered": sus_registered,
            "unit": f"UBS {zone} Central",
            "last_update": TIMESTAMP,
        },
        "cad_unico": {
            "registered": cad_registered,
            "nis": f"{seed:011d}" if cad_registered else None,
            "last_update": TIMESTAMP,
        },
        "bolsa_familia": {
            "registered": bolsa_beneficiary,
            "beneficiary": bolsa_beneficiary,
            "status": "ativo" if bolsa_beneficiary else "avaliacao",
            "last_update": TIMESTAMP,
        },
        "others": [
            {"name": "transporte_escolar", "active": seed % 2 == 0},
            {"name": "programa_alimentacao", "active": seed % 4 == 0},
        ],
    }

    entries = [
        ("sus", {"registered": services["sus"]["registered"], "unit": services["sus"]["unit"]}),
        (
            "cad_unico",
            {
                "registered": services["cad_unico"]["registered"],
                "nis": services["cad_unico"]["nis"],
            },
        ),
        (
            "bolsa_familia",
            {
                "beneficiary": services["bolsa_familia"]["beneficiary"],
                "status": services["bolsa_familia"]["status"],
            },
        ),
        (
            "outro",
            {
                "services": [item["name"] for item in services["others"] if item["active"]],
            },
        ),
    ]
    return services, entries


def _coordinate(base_lat: float, base_lon: float, rng: Random) -> Tuple[float, float]:
    return (
        round(base_lat + rng.uniform(-0.03, 0.03), 6),
        round(base_lon + rng.uniform(-0.03, 0.03), 6),
    )


def _generate_seed() -> SeedData:
    rng = Random(42)
    persons: List[dict] = []
    students: List[dict] = []
    volunteers: List[dict] = []
    families: List[dict] = []
    relationships: List[dict] = []
    services: List[dict] = []

    person_counter = 0
    relationship_counter = 0
    service_counter = 0

    zone_keys = list(ZONES.keys())
    zone_student_counts = {zone: 0 for zone in zone_keys}

    for student_index in range(1, TOTAL_STUDENTS + 1):
        zone = zone_keys[(student_index - 1) % len(zone_keys)]
        zone_student_counts[zone] += 1
        zone_progress = zone_student_counts[zone]
        base_lat = ZONES[zone]["lat"]
        base_lon = ZONES[zone]["lon"]

        student_coord = _coordinate(base_lat, base_lon, rng)
        guardian_coord = (
            round(student_coord[0] + rng.uniform(-0.002, 0.002), 6),
            round(student_coord[1] + rng.uniform(-0.002, 0.002), 6),
        )

        guardian_id = _format_id("P", person_counter + 1)
        person_counter += 1
        student_person_id = _format_id("P", person_counter + 1)
        person_counter += 1

        guardian_first = GUARDIAN_NAMES[(student_index - 1) % len(GUARDIAN_NAMES)]
        student_first = STUDENT_NAMES[(student_index - 1) % len(STUDENT_NAMES)]

        guardian = {
            "id": guardian_id,
            "name": f"{guardian_first} {zone}",
            "preferred_name": guardian_first,
            "document": {"type": "RG", "number": f"{zone[:2].upper()}-{guardian_id[1:]}"},
            "birthdate": _birthdate(1970, zone_progress),
            "gender": "female" if guardian_first.endswith("a") else "male",
            "profession": "trabalhador autônomo",
            "address": {
                "street": f"Rua {zone} {zone_progress}",
                "number": str(100 + (zone_progress % 200)),
                "complement": "Casa",
                "neighborhood": "Centro",
                "city": ZONE_META[zone]["city"],
                "state": ZONE_META[zone]["state"],
                "postal_code": ZONE_META[zone]["postal_code"],
            },
            "contacts": {
                "phone": f"+55 99 9{student_index:04d}-0000",
                "email": f"{guardian_id.lower()}@example.com",
                "preferred_channel": "whatsapp" if student_index % 2 == 0 else "telefone",
            },
            "coordinates": {"latitude": guardian_coord[0], "longitude": guardian_coord[1]},
            "vulnerability_flags": {
                "elderly": student_index % 5 == 0,
                "single_parent": student_index % 3 == 0,
                "low_income": True,
            },
            "tags": ["responsavel", "seed"],
        }
        persons.append(guardian)

        student_person = {
            "id": student_person_id,
            "name": f"{student_first} {zone}",
            "preferred_name": student_first,
            "document": {"type": "RM", "number": f"{zone[:2].upper()}-{student_person_id[1:]}"},
            "birthdate": _birthdate(2010, zone_progress),
            "gender": "female" if student_first.endswith("a") else "male",
            "profession": "estudante",
            "address": guardian["address"],
            "contacts": {
                "phone": f"+55 98 8{student_index:04d}-0000",
                "email": f"{student_person_id.lower()}@example.com",
                "preferred_channel": "whatsapp",
            },
            "coordinates": {"latitude": student_coord[0], "longitude": student_coord[1]},
            "vulnerability_flags": {
                "elderly": False,
                "single_parent": False,
                "low_income": True,
            },
            "tags": ["student", "seed"],
        }
        persons.append(student_person)

        family_id = _format_id("F", student_index)
        services_dict, cache_entries = _compose_services(family_id, zone)
        family = {
            "id": family_id,
            "household": [
                {"person_id": guardian_id, "role": "guardian"},
                {"person_id": student_person_id, "role": "student"},
            ],
            "external_services": services_dict,
            "eligibility_signals": ["low_income"] + (["mobilidade"] if student_index % 7 == 0 else []),
            "consent": {"family_granted": True, "updated_at": TIMESTAMP},
            "record_linkage": {
                "inputs": ["SED", "SUS", "CadÚnico", "Bolsa Família"],
                "confidence": round(min(0.99, 0.82 + (student_index % 15) / 100), 2),
                "explanations": [f"Dados mock conciliados para a zona {zone} (seed)."],
            },
            "warm_notes": f"Família {family_id} gerada para simulação na zona {zone}.",
        }
        families.append(family)

        for source, payload in cache_entries:
            service_counter += 1
            services.append(
                {
                    "id": _format_id("SV", service_counter),
                    "family_id": family_id,
                    "source": source,
                    "payload": payload,
                    "fetched_at": TIMESTAMP,
                }
            )

        school_info = SCHOOL_MAP[zone]
        grade_cycle = ["5º ano", "6º ano", "7º ano", "8º ano", "9º ano"]
        grade = grade_cycle[(student_index - 1) % len(grade_cycle)]
        student = {
            "id": _format_id("S", student_index),
            "person_id": student_person_id,
            "family_id": family_id,
            "zone": zone,
            "school": {
                "school_id": school_info["school_id"],
                "school_name": school_info["school_name"],
                "grade": grade,
                "classroom": f"{grade.split()[0]}-{chr(65 + ((student_index - 1) % 3))}",
                "shift": "manhã" if student_index % 2 == 0 else "tarde",
                "enrollment_status": "ativo",
            },
            "attendance_last_30d": {"absences": (student_index % 4), "delays": (student_index % 3)},
            "disabilities": {"wheelchair_user": student_index % 10 == 0},
            "warm_notes": f"Aluno seed gerado para a zona {zone}.",
            "coordinates": {"latitude": student_coord[0], "longitude": student_coord[1]},
            "tags": ["seed", zone.lower()],
        }
        students.append(student)

        relationship_counter += 1
        relationships.append(
            {
                "id": _format_id("E", relationship_counter),
                "from_person_id": guardian_id,
                "to_person_id": student_person_id,
                "type": "guardian_of",
                "weight": 1.0,
            }
        )

    volunteer_counter = 0
    for zone in zone_keys:
        base_lat = ZONES[zone]["lat"]
        base_lon = ZONES[zone]["lon"]
        for idx in range(1, VOLUNTEERS_PER_ZONE + 1):
            volunteer_counter += 1
            name_seed = VOLUNTEER_NAMES[(volunteer_counter - 1) % len(VOLUNTEER_NAMES)]
            coord = _coordinate(base_lat, base_lon, rng)
            skills = [SKILL_POOL[(volunteer_counter - 1) % len(SKILL_POOL)]]
            secondary_skill = SKILL_POOL[(volunteer_counter + 2) % len(SKILL_POOL)]
            if secondary_skill not in skills:
                skills.append(secondary_skill)

            weekdays = WEEKDAY_OPTIONS[(volunteer_counter - 1) % len(WEEKDAY_OPTIONS)]
            time_slots = TIME_SLOT_OPTIONS[(volunteer_counter - 1) % len(TIME_SLOT_OPTIONS)]

            languages = ["pt-BR"]
            if volunteer_counter % 5 == 0:
                languages.append("inglês")

            volunteer = {
                "id": _format_id("V", volunteer_counter),
                "name": name_seed,
                "zone": zone,
                "address": {
                    "street": f"Av. {zone}",
                    "number": str(200 + idx),
                    "neighborhood": "Centro",
                    "city": ZONE_META[zone]["city"],
                    "state": ZONE_META[zone]["state"],
                    "postal_code": ZONE_META[zone]["postal_code"],
                },
                "contact": {
                    "phone": f"+55 97 9{volunteer_counter:04d}-0000",
                    "email": f"vol{volunteer_counter:04d}@example.com",
                    "whatsapp_preferred": volunteer_counter % 2 == 0,
                },
                "coordinates": {"latitude": coord[0], "longitude": coord[1]},
                "max_students": 10,
                "radius_km": round(6.0 + (volunteer_counter % 4), 1),
                "availability": {"weekdays": weekdays, "time_slots": time_slots},
                "skills": skills,
                "languages": languages,
                "experience_years": volunteer_counter % 6,
                "accessibility": {
                    "mobility_assistance": volunteer_counter % 3 == 0,
                    "vehicle_type": "car" if volunteer_counter % 3 == 0 else "public_transport",
                },
                "verified": volunteer_counter % 2 == 0,
                "warm_notes": f"Voluntário seed disponível para a zona {zone}.",
                "tags": ["tutor", zone.lower()],
            }
            volunteers.append(volunteer)

    return SeedData(
        persons=persons,
        students=students,
        volunteers=volunteers,
        families=families,
        relationships=relationships,
        services=services,
    )


_seed_cache = _generate_seed()

PERSONS: List[dict] = _seed_cache.persons
STUDENTS: List[dict] = _seed_cache.students
VOLUNTEERS: List[dict] = _seed_cache.volunteers
FAMILIES: List[dict] = _seed_cache.families
RELATIONSHIPS: List[dict] = _seed_cache.relationships
SERVICES: List[dict] = _seed_cache.services


def write_seed_files(force: bool = False) -> None:
    """Escreve os arquivos JSON de seed na pasta data/."""
    base_dir = Path(__file__).resolve().parent.parent / "data"
    base_dir.mkdir(parents=True, exist_ok=True)

    payloads = [
        (base_dir / "persons.json", "persons", PERSONS),
        (base_dir / "students.json", "students", STUDENTS),
        (base_dir / "volunteers.json", "volunteers", VOLUNTEERS),
        (base_dir / "families.json", "families", FAMILIES),
        (base_dir / "assignments.json", "assignments", []),
        (base_dir / "relationships.json", "edges", RELATIONSHIPS),
        (base_dir / "services_cache.json", "services", SERVICES),
    ]

    for path, root, data in payloads:
        if path.exists() and not force:
            continue
        with path.open("w", encoding="utf-8") as handle:
            json.dump({root: data}, handle, indent=2, ensure_ascii=False)

    zones_path = base_dir / "zones.json"
    if (not zones_path.exists()) or force:
        with zones_path.open("w", encoding="utf-8") as handle:
            json.dump({"zones": ZONES}, handle, indent=2, ensure_ascii=False)

    config_path = base_dir / "config.json"
    if (not config_path.exists()) or force:
        with config_path.open("w", encoding="utf-8") as handle:
            json.dump(CONFIG, handle, indent=2, ensure_ascii=False)

    audit_path = base_dir / "audit_log.jsonl"
    if force and audit_path.exists():
        audit_path.unlink()
    audit_path.touch(exist_ok=True)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Gera arquivos seed JSON grandes para o backend.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Sobrescreve arquivos existentes em data/.",
    )
    args = parser.parse_args()
    write_seed_files(force=args.force)
    print(
        "Seeds gerados com sucesso:",
        f"{len(PERSONS)} pessoas, {len(STUDENTS)} alunos, {len(VOLUNTEERS)} voluntários.",
    )
