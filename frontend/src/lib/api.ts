import axios from "axios";

import type {
  AssignmentRecord,
  FamilyProfile,
  InsightResponse,
  NetworkResponse,
  StudentProfile,
  VolunteerProfile,
} from "../types/models";

type SyncStudentsResponse = {
  zone: string;
  added?: StudentProfile[];
  added_students?: StudentProfile[];
  touched_families?: string[];
  explanation: string;
  [key: string]: unknown;
};

type AssignmentSummary = {
  volunteer_id: string;
  zone: string;
  assigned: number;
  capacity: number;
};

type RunAssignmentResponse = {
  assigned: Array<{
    student_id: string;
    volunteer_id: string;
    distance_km?: number;
  }>;
  unassigned: Array<{ student_id: string; reason: string }>;
  summary?: AssignmentSummary[];
  explanation: string;
};

const envBaseUrl = import.meta.env.VITE_API_BASE;
const baseURL =
  typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0
    ? envBaseUrl
    : "http://localhost:8000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const detail =
        (error.response?.data as { detail?: unknown } | undefined)?.detail;
      if (detail) {
        console.error("Detalhe da API:", detail);
      }
      return Promise.reject(error);
    }
    const fallbackError =
      error instanceof Error
        ? error
        : new Error("Falha inesperada ao se comunicar com a API.");
    return Promise.reject(fallbackError);
  },
);

export const fetchVolunteers = async (zone: string) => {
  const response = await api.get<{ volunteers: VolunteerProfile[] }>(
    `/volunteers`,
    {
      params: { zone },
    },
  );
  return response.data.volunteers;
};

export const fetchStudents = async (zone: string) => {
  const response = await api.get<{ students: StudentProfile[] }>(`/students`, {
    params: { zone },
  });
  return response.data.students;
};

export const fetchAssignments = async (zone: string) => {
  const response = await api.get<{ assignments: AssignmentRecord[] }>(
    `/assignments`,
    {
      params: { zone },
    },
  );
  return response.data.assignments;
};

export const syncStudents = async (zone: string) => {
  const response = await api.get<SyncStudentsResponse>(`/sync/students`, {
    params: { zone },
  });
  return response.data;
};

export const runAssignment = async (zone?: string) => {
  const response = await api.post<RunAssignmentResponse>(
    `/assign`,
    zone ? { zone } : {},
  );
  return response.data;
};

export const fetchFamily = async (familyId: string) => {
  const response = await api.get<{ family: FamilyProfile }>(
    `/family/${familyId}`,
  );
  return response.data.family;
};

export const fetchStudentNetwork = async (studentId: string) => {
  const response = await api.get<NetworkResponse>(
    `/network/student/${studentId}`,
  );
  return response.data;
};

export const generateStudentInsight = async (studentId: string) => {
  const response = await api.post<InsightResponse>(`/insights/student`, {
    student_id: studentId,
  });
  return response.data;
};

export const generateFamilyInsight = async (familyId: string) => {
  const response = await api.post<InsightResponse>(`/insights/family`, {
    family_id: familyId,
  });
  return response.data;
};

export default api;
