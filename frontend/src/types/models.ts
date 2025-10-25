export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type StudentSchool = {
  school_id: string;
  school_name: string;
  grade: string;
  classroom: string;
  shift: string;
  enrollment_status: string;
};

export type StudentAttendance = {
  absences: number;
  delays: number;
};

export type StudentDisabilities = {
  wheelchair_user: boolean;
};

export type StudentProfile = {
  id: string;
  person_id: string;
  family_id: string;
  zone: string;
  school: StudentSchool;
  attendance_last_30d: StudentAttendance;
  disabilities: StudentDisabilities;
  warm_notes?: string;
  coordinates?: Coordinates;
  tags: string[];
};

export type VolunteerContact = {
  phone?: string;
  email?: string;
  whatsapp_preferred?: boolean;
};

export type VolunteerAvailability = {
  weekdays: string[];
  time_slots: string[];
};

export type VolunteerAccessibility = {
  mobility_assistance: boolean;
  vehicle_type?: string | null;
};

export type Address = {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood?: string | null;
  city: string;
  state: string;
  postal_code: string;
};

export type VolunteerProfile = {
  id: string;
  name: string;
  zone: string;
  address: Address;
  contact: VolunteerContact;
  coordinates?: Coordinates;
  max_students: number;
  radius_km: number;
  availability: VolunteerAvailability;
  skills: string[];
  languages: string[];
  experience_years: number;
  accessibility: VolunteerAccessibility;
  verified: boolean;
  warm_notes?: string;
  tags: string[];
};

export type AssignmentRecord = {
  student_id: string;
  volunteer_id: string;
  zone: string;
  distance_km?: number;
  created_at: string;
  rationale?: string;
};

export type FamilyHouseholdMember = {
  person_id: string;
  role: "guardian" | "student" | "sibling" | "relative" | "other";
};

export type ExternalServiceFootprint = {
  registered?: boolean;
  unit?: string | null;
  last_update?: string | null;
  nis?: string | null;
  beneficiary?: boolean;
  status?: string | null;
};

export type FamilyExternalServices = {
  sus: ExternalServiceFootprint;
  cad_unico: ExternalServiceFootprint;
  bolsa_familia: ExternalServiceFootprint;
  others: Array<{ name: string; active: boolean }>;
};

export type FamilyProfile = {
  id: string;
  household: FamilyHouseholdMember[];
  external_services: FamilyExternalServices;
  eligibility_signals: string[];
  consent: { family_granted: boolean; updated_at?: string };
  record_linkage: {
    inputs: string[];
    confidence: number;
    explanations: string[];
  };
  warm_notes?: string;
};

export type NetworkNode = {
  id: string;
  type: string;
  label: string;
  [key: string]: unknown;
};

export type NetworkEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  [key: string]: unknown;
};

export type NetworkResponse = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  explanation?: string;
};

export type InsightResponse = {
  student_id?: string;
  family_id?: string;
  insight: string;
  source: "openai" | "mock" | "fallback";
  model?: string | "none";
  generated_at?: string;
};
