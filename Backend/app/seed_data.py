# -*- coding: utf-8 -*-
"""
Geração determinística de sementes (>=3000 alunos) para os arquivos JSON.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from random import Random
from typing import Dict, List, Tuple

from .constants import (
    ELIGIBILITY_BAIXA_RENDA,
    ELIGIBILITY_FAMILIA_MONOPARENTAL,
    ELIGIBILITY_NECESSIDADE_MOBILIDADE,
    ELIGIBILITY_RESPONSAVEL_IDOSO,
)
from .utils.names import (
    generate_guardian_name,
    generate_student_name,
    generate_volunteer_name,
)

TOTAL_STUDENTS = 3000
VOLUNTEERS_PER_ZONE = 120
TIMESTAMP = datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()

# Centros geográficos aproximados por zona
ZONES: Dict[str, Dict[str, float]] = {
    "São Paulo": {"lat": -23.5505, "lon": -46.6333},
    "Franca": {"lat": -20.5386, "lon": -47.4009},
    "Goiânia": {"lat": -16.6869, "lon": -49.2648},

    # Zonas adicionais
    "Campinas": {"lat": -22.9056, "lon": -47.0608},
    "Rio de Janeiro": {"lat": -22.9068, "lon": -43.1729},
    "Belo Horizonte": {"lat": -19.9167, "lon": -43.9345},
    "Curitiba": {"lat": -25.4284, "lon": -49.2733},
    "Porto Alegre": {"lat": -30.0346, "lon": -51.2177},
    "Recife": {"lat": -8.0476, "lon": -34.8770},
    "Salvador": {"lat": -12.9777, "lon": -38.5016},
    "Fortaleza": {"lat": -3.7319, "lon": -38.5267},
    "Brasília": {"lat": -15.7939, "lon": -47.8828},
    "Manaus": {"lat": -3.1190, "lon": -60.0217},
    "Belém": {"lat": -1.4558, "lon": -48.4902},
    "Natal": {"lat": -5.7945, "lon": -35.2110},
    "João Pessoa": {"lat": -7.1153, "lon": -34.8641},
    "Maceió": {"lat": -9.6498, "lon": -35.7089},
    "Aracaju": {"lat": -10.9472, "lon": -37.0731},
    "Santos": {"lat": -23.9608, "lon": -46.3336},
    "Sorocaba": {"lat": -23.5015, "lon": -47.4526},
    "Ribeirão Preto": {"lat": -21.1775, "lon": -47.8103},
    "São José dos Campos": {"lat": -23.2237, "lon": -45.9009},
    "Guarulhos": {"lat": -23.4543, "lon": -46.5333},
}

# Metadados por zona (cidade/UF/CEP-base)
ZONE_META = {
    "São Paulo": {"city": "São Paulo", "state": "SP", "postal_code": "01000-000"},
    "Franca": {"city": "Franca", "state": "SP", "postal_code": "14400-000"},
    "Goiânia": {"city": "Goiânia", "state": "GO", "postal_code": "74000-000"},

    "Campinas": {"city": "Campinas", "state": "SP", "postal_code": "13000-000"},
    "Rio de Janeiro": {"city": "Rio de Janeiro", "state": "RJ", "postal_code": "20000-000"},
    "Belo Horizonte": {"city": "Belo Horizonte", "state": "MG", "postal_code": "30100-000"},
    "Curitiba": {"city": "Curitiba", "state": "PR", "postal_code": "80000-000"},
    "Porto Alegre": {"city": "Porto Alegre", "state": "RS", "postal_code": "90000-000"},
    "Recife": {"city": "Recife", "state": "PE", "postal_code": "50000-000"},
    "Salvador": {"city": "Salvador", "state": "BA", "postal_code": "40000-000"},
    "Fortaleza": {"city": "Fortaleza", "state": "CE", "postal_code": "60000-000"},
    "Brasília": {"city": "Brasília", "state": "DF", "postal_code": "70000-000"},
    "Manaus": {"city": "Manaus", "state": "AM", "postal_code": "69000-000"},
    "Belém": {"city": "Belém", "state": "PA", "postal_code": "66000-000"},
    "Natal": {"city": "Natal", "state": "RN", "postal_code": "59000-000"},
    "João Pessoa": {"city": "João Pessoa", "state": "PB", "postal_code": "58000-000"},
    "Maceió": {"city": "Maceió", "state": "AL", "postal_code": "57000-000"},
    "Aracaju": {"city": "Aracaju", "state": "SE", "postal_code": "49000-000"},
    "Santos": {"city": "Santos", "state": "SP", "postal_code": "11000-000"},
    "Sorocaba": {"city": "Sorocaba", "state": "SP", "postal_code": "18000-000"},
    "Ribeirão Preto": {"city": "Ribeirão Preto", "state": "SP", "postal_code": "14000-000"},
    "São José dos Campos": {"city": "São José dos Campos", "state": "SP", "postal_code": "12200-000"},
    "Guarulhos": {"city": "Guarulhos", "state": "SP", "postal_code": "07000-000"},
}

# Mapeamento de escolas por zona
SCHOOL_MAP = {
    "São Paulo": {"school_id": "ESC701", "school_name": "EE Zona Centro"},
    "Franca": {"school_id": "ESC702", "school_name": "EE Franca Norte"},
    "Goiânia": {"school_id": "ESC703", "school_name": "EM Goiânia Leste"},

    "Campinas": {"school_id": "ESC704", "school_name": "EE Campinas Centro"},
    "Rio de Janeiro": {"school_id": "ESC705", "school_name": "EM Rio Zona Sul"},
    "Belo Horizonte": {"school_id": "ESC706", "school_name": "EE BH Pampulha"},
    "Curitiba": {"school_id": "ESC707", "school_name": "EM Curitiba Centro"},
    "Porto Alegre": {"school_id": "ESC708", "school_name": "EE Porto Alegre Norte"},
    "Recife": {"school_id": "ESC709", "school_name": "EM Recife Boa Vista"},
    "Salvador": {"school_id": "ESC710", "school_name": "EM Salvador Itapuã"},
    "Fortaleza": {"school_id": "ESC711", "school_name": "EE Fortaleza Aldeota"},
    "Brasília": {"school_id": "ESC712", "school_name": "CEM Brasília Asa Sul"},
    "Manaus": {"school_id": "ESC713", "school_name": "EM Manaus Centro"},
    "Belém": {"school_id": "ESC714", "school_name": "EE Belém Nazaré"},
    "Natal": {"school_id": "ESC715", "school_name": "EM Natal Tirol"},
    "João Pessoa": {"school_id": "ESC716", "school_name": "EE João Pessoa Tambiá"},
    "Maceió": {"school_id": "ESC717", "school_name": "EM Maceió Pajuçara"},
    "Aracaju": {"school_id": "ESC718", "school_name": "EE Aracaju Centro"},
    "Santos": {"school_id": "ESC719", "school_name": "EM Santos Gonzaga"},
    "Sorocaba": {"school_id": "ESC720", "school_name": "EE Sorocaba Campolim"},
    "Ribeirão Preto": {"school_id": "ESC721", "school_name": "EE Ribeirão Preto Centro"},
    "São José dos Campos": {"school_id": "ESC722", "school_name": "EM São José dos Campos Centro"},
    "Guarulhos": {"school_id": "ESC723", "school_name": "EE Guarulhos Centro"},
}

# Pool de habilidades (já em PT-BR)
SKILL_POOL = [
    "reforço português",
    "matemática básica",
    "ciências",
    "leitura orientada",
    "artes",
    "tecnologia",
]

# Dias da semana e faixas de horário (conteúdos em PT-BR)
WEEKDAY_OPTIONS = [
    ["seg", "qua"],
    ["ter", "qui"],
    ["sab"],
    ["seg", "qui", "sab"],
]

TIME_SLOT_OPTIONS = [
    ["manhã"],
    ["tarde"],
    ["noite"],
    ["manhã", "tarde"],
]

# Parâmetros gerais (mantidos em inglês para não quebrar consumidores)
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
            "status": "ativo" if bolsa_beneficiary else "avaliação",
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

        guardian_full, guardian_preferred, guardian_gender = generate_guardian_name(student_index)
        student_full, student_preferred, student_gender = generate_student_name(student_index)

        guardian = {
            "id": guardian_id,
            "name": guardian_full,
            "preferred_name": guardian_preferred,
            "document": {
                "type": "RG",
                "number": f"{ZONE_META[zone]['state']}-{guardian_id[1:]}",  # usa UF em vez de fatia do nome da zona
            },
            "birthdate": _birthdate(1970, zone_progress),
            "gender": guardian_gender,
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
            "tags": ["responsável", "semente"],
        }
        persons.append(guardian)

        student_person = {
            "id": student_person_id,
            "name": student_full,
            "preferred_name": student_preferred,
            "document": {
                "type": "RM",
                "number": f"{ZONE_META[zone]['state']}-{student_person_id[1:]}",
            },
            "birthdate": _birthdate(2010, zone_progress),
            "gender": student_gender,
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
            "tags": ["aluno", "semente"],
        }
        persons.append(student_person)

        family_id = _format_id("F", student_index)
        services_dict, cache_entries = _compose_services(family_id, zone)
        eligibility_signals = {ELIGIBILITY_BAIXA_RENDA}
        if guardian["vulnerability_flags"]["elderly"]:
            eligibility_signals.add(ELIGIBILITY_RESPONSAVEL_IDOSO)
        if guardian["vulnerability_flags"]["single_parent"]:
            eligibility_signals.add(ELIGIBILITY_FAMILIA_MONOPARENTAL)
        if student_index % 7 == 0:
            eligibility_signals.add(ELIGIBILITY_NECESSIDADE_MOBILIDADE)

        family = {
            "id": family_id,
            "household": [
                {"person_id": guardian_id, "role": "guardian"},
                {"person_id": student_person_id, "role": "student"},
            ],
            "external_services": services_dict,
            "eligibility_signals": sorted(eligibility_signals),
            "consent": {"family_granted": True, "updated_at": TIMESTAMP},
            "record_linkage": {
                "inputs": ["SED", "SUS", "CadÚnico", "Bolsa Família"],
                "confidence": round(min(0.99, 0.82 + (student_index % 15) / 100), 2),
                "explanations": [f"Dados simulados conciliados para a zona {zone} (semente)."],
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
            "warm_notes": f"Aluno gerado para simulação na zona {zone}.",
            "coordinates": {"latitude": student_coord[0], "longitude": student_coord[1]},
            "tags": ["semente", zone.lower()],
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
            volunteer_name = generate_volunteer_name(volunteer_counter)
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
                "name": volunteer_name,
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
                    "vehicle_type": "carro" if volunteer_counter % 3 == 0 else "transporte_público",
                },
                "verified": volunteer_counter % 2 == 0,
                "warm_notes": f"Voluntário gerado para simulação na zona {zone}.",
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
    """Escreve os arquivos JSON de semente na pasta data/."""
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

    parser = argparse.ArgumentParser(description="Gera arquivos de sementes (seed) JSON grandes para o backend.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Sobrescreve arquivos existentes em data/.",
    )
    args = parser.parse_args()
    write_seed_files(force=args.force)
    print(
        "Sementes geradas com sucesso:",
        f"{len(PERSONS)} pessoas, {len(STUDENTS)} alunos, {len(VOLUNTEERS)} voluntários.",
    )
