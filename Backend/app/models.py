"""Modelos Pydantic utilizados na API."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class Document(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    number: Optional[str] = None


class Address(BaseModel):
    model_config = ConfigDict(extra="forbid")

    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    postal_code: str


class ContactChannels(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_channel: Optional[str] = None


class Coordinates(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float
    longitude: float


class VulnerabilityFlags(BaseModel):
    model_config = ConfigDict(extra="forbid")

    elderly: bool = False
    single_parent: bool = False
    low_income: bool = False


class PersonProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    preferred_name: Optional[str] = None
    document: Document
    birthdate: str
    gender: Optional[str] = None
    profession: Optional[str] = None
    address: Address
    contacts: ContactChannels
    coordinates: Coordinates
    vulnerability_flags: VulnerabilityFlags
    tags: List[str] = Field(default_factory=list)


class StudentSchool(BaseModel):
    model_config = ConfigDict(extra="forbid")

    school_id: str
    school_name: str
    grade: str
    classroom: str
    shift: str
    enrollment_status: str


class StudentAttendance(BaseModel):
    model_config = ConfigDict(extra="forbid")

    absences: int = 0
    delays: int = 0


class StudentDisabilities(BaseModel):
    model_config = ConfigDict(extra="forbid")

    wheelchair_user: bool = False


class StudentProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    person_id: str
    family_id: str
    zone: str
    school: StudentSchool
    attendance_last_30d: StudentAttendance
    disabilities: StudentDisabilities
    warm_notes: Optional[str] = None
    coordinates: Coordinates
    tags: List[str] = Field(default_factory=list)


class VolunteerContact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp_preferred: bool = False


class VolunteerAvailability(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weekdays: List[str] = Field(default_factory=list)
    time_slots: List[str] = Field(default_factory=list)


class VolunteerAccessibility(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mobility_assistance: bool = False
    vehicle_type: Optional[str] = None


class VolunteerProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    zone: str
    address: Address
    contact: VolunteerContact
    coordinates: Coordinates
    max_students: int = 10
    radius_km: float = 8.0
    availability: VolunteerAvailability
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    experience_years: int = 0
    accessibility: VolunteerAccessibility
    verified: bool = False
    warm_notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class FamilyHouseholdMember(BaseModel):
    model_config = ConfigDict(extra="forbid")

    person_id: str
    role: Literal[
        "guardian",
        "student",
        "sibling",
        "relative",
        "other",
    ]


class ExternalServiceFootprint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    registered: Optional[bool] = None
    unit: Optional[str] = None
    last_update: Optional[str] = None
    nis: Optional[str] = None
    beneficiary: Optional[bool] = None
    status: Optional[str] = None


class ExternalServiceItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    active: bool = False


class FamilyExternalServices(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sus: ExternalServiceFootprint
    cad_unico: ExternalServiceFootprint
    bolsa_familia: ExternalServiceFootprint
    others: List[ExternalServiceItem] = Field(default_factory=list)


class FamilyConsent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    family_granted: bool = False
    updated_at: Optional[str] = None


class RecordLinkage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inputs: List[str] = Field(default_factory=list)
    confidence: float
    explanations: List[str] = Field(default_factory=list)


class FamilyProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    household: List[FamilyHouseholdMember]
    external_services: FamilyExternalServices
    eligibility_signals: List[str] = Field(default_factory=list)
    consent: FamilyConsent
    record_linkage: RecordLinkage
    warm_notes: Optional[str] = None


class RelationshipEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    from_person_id: str
    to_person_id: str
    type: Literal[
        "guardian_of",
        "sibling_of",
        "lives_with",
        "custodian_of",
        "other",
    ]
    weight: float = 1.0


class ExternalServiceStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    family_id: str
    source: str
    payload: dict
    fetched_at: str


class AssignmentRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str
    volunteer_id: str
    zone: str
    distance_km: float
    rationale: str
    created_at: str


class AssignmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    zone: Optional[str] = None
    max_radius_km: Optional[float] = None


class VolunteerUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: Optional[str] = None
    name: str
    zone: str
    address: Address
    contact: VolunteerContact
    coordinates: Coordinates
    max_students: Optional[int] = None
    radius_km: Optional[float] = None
    availability: VolunteerAvailability
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    experience_years: Optional[int] = None
    accessibility: VolunteerAccessibility
    verified: Optional[bool] = None
    warm_notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ServiceUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    family_id: str
    source: str
    payload: dict


class InsightStudentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str


class InsightFamilyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    family_id: str


class GraphResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nodes: List[dict]
    edges: List[dict]


__all__ = [
    "AssignmentRecord",
    "AssignmentRequest",
    "Document",
    "FamilyProfile",
    "GraphResponse",
    "InsightFamilyRequest",
    "InsightStudentRequest",
    "PersonProfile",
    "RelationshipEdge",
    "ServiceUpdatePayload",
    "StudentProfile",
    "VolunteerProfile",
    "VolunteerUpsert",
    "ExternalServiceStatus",
]
