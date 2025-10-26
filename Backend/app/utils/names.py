"""Utility helpers for generating Portuguese names deterministically."""

from __future__ import annotations

from threading import Lock
from typing import Literal, Tuple

from faker import Faker

Locale = "pt_BR"

_guardian_faker = Faker(Locale)
_student_faker = Faker(Locale)
_volunteer_faker = Faker(Locale)

_guardian_lock = Lock()
_student_lock = Lock()
_volunteer_lock = Lock()


def _seeded_name(
    faker: Faker,
    lock: Lock,
    seed: int,
    gender: Literal["female", "male"],
) -> Tuple[str, str]:
    """Return full and first name using a deterministic seed."""
    with lock:
        faker.seed_instance(seed)
        if gender == "female":
            first = faker.first_name_female()
        else:
            first = faker.first_name_male()
        last = faker.last_name()
    full = f"{first} {last}"
    return full, first


def generate_guardian_name(seed: int) -> Tuple[str, str, Literal["female", "male"]]:
    """Generate guardian full name, preferred name and gender."""
    gender: Literal["female", "male"] = "female" if seed % 2 == 0 else "male"
    full, first = _seeded_name(_guardian_faker, _guardian_lock, 1_000_000 + seed, gender)
    return full, first, gender


def generate_student_name(seed: int) -> Tuple[str, str, Literal["female", "male"]]:
    """Generate student full name, preferred name and gender."""
    gender: Literal["female", "male"] = "female" if seed % 2 == 1 else "male"
    full, first = _seeded_name(_student_faker, _student_lock, 2_000_000 + seed, gender)
    return full, first, gender


def generate_volunteer_name(seed: int) -> str:
    """Generate volunteer name in Portuguese."""
    with _volunteer_lock:
        _volunteer_faker.seed_instance(3_000_000 + seed)
        return _volunteer_faker.name()
