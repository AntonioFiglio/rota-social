import axios from "axios";

import type {
  AssignmentRecord,
  FamilyProfile,
  InsightResponse,
  NetworkResponse,
  StudentProfile,
  VolunteerProfile,
} from "../types/models";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail) {
      console.error("API error detail:", error.response.data.detail);
    }
    return Promise.reject(error);
  },
);

export type PaginatedResponse<T> = {
  [key: string]: T[];
  explanation?: string;
};

export const fetchVolunteers = async (zone: string) => {
  const { data } = await api.get<{ volunteers: VolunteerProfile[] }>(
    `/volunteers`,
    {
      params: { zone },
    },
  );
  return data.volunteers;
};

export const fetchStudents = async (zone: string) => {
  const { data } = await api.get<{ students: StudentProfile[] }>(`/students`, {
    params: { zone },
  });
  return data.students;
};

export const fetchAssignments = async (zone: string) => {
  const { data } = await api.get<{ assignments: AssignmentRecord[] }>(
    `/assignments`,
    {
      params: { zone },
    },
  );
  return data.assignments;
};

export const syncStudents = async (zone: string) => {
  const { data } = await api.get(`/sync/students`, { params: { zone } });
  return data;
};

export const runAssignment = async (zone?: string) => {
  const { data } = await api.post(`/assign`, zone ? { zone } : {});
  return data as {
    assigned: Array<{ student_id: string; volunteer_id: string }>;
    unassigned: Array<{ student_id: string; reason: string }>;
  };
};

export const fetchFamily = async (familyId: string) => {
  const { data } = await api.get<{ family: FamilyProfile }>(
    `/family/${familyId}`,
  );
  return data.family;
};

export const fetchStudentNetwork = async (studentId: string) => {
  const { data } = await api.get<NetworkResponse>(
    `/network/student/${studentId}`,
  );
  return data;
};

export const generateStudentInsight = async (studentId: string) => {
  const { data } = await api.post<InsightResponse>(`/insights/student`, {
    student_id: studentId,
  });
  return data;
};

export const generateFamilyInsight = async (familyId: string) => {
  const { data } = await api.post<InsightResponse>(`/insights/family`, {
    family_id: familyId,
  });
  return data;
};

export default api;
