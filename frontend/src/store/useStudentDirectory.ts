import { create } from "zustand";
import { useEffect, useMemo } from "react";

import { fetchStudentNetwork } from "../lib/api";
import type { NetworkResponse } from "../types/models";

export const STUDENT_NAME_PLACEHOLDER = "Aluno em atualização";

type StudentDirectoryState = {
  names: Record<string, string>;
  inFlight: Partial<Record<string, Promise<string>>>;
  fetchName: (studentId: string) => Promise<string>;
  ensureNames: (studentIds: string[]) => void;
  setName: (studentId: string, name: string) => void;
};

const extractStudentName = (
  response: NetworkResponse,
  studentId: string,
): string | undefined => {
  const { nodes, edges } = response;

  // Prefer relation self_profile from person node → student id
  const profileEdge = edges.find(
    (edge) => edge.type === "self_profile" && edge.to === studentId,
  );
  if (profileEdge) {
    const personNode = nodes.find((node) => node.id === profileEdge.from);
    if (typeof personNode?.label === "string" && personNode.label.trim()) {
      return personNode.label.trim();
    }
  }

  // Fallback: use student node label if it is not the raw ID
  const studentNode = nodes.find((node) => node.id === studentId);
  if (
    typeof studentNode?.label === "string" &&
    studentNode.label.trim() &&
    studentNode.label.trim() !== studentId
  ) {
    return studentNode.label.trim();
  }

  return undefined;
};

export const useStudentDirectory = create<StudentDirectoryState>((set, get) => ({
  names: {},
  inFlight: {},
  setName: (studentId, name) =>
    set((state) => ({
      names: { ...state.names, [studentId]: name },
    })),
  fetchName: async (studentId: string) => {
    if (!studentId) {
      return "";
    }
    const state = get();
    if (state.names[studentId]) {
      return state.names[studentId];
    }
    const ongoing = state.inFlight[studentId];
    if (ongoing) {
      return ongoing;
    }
    const promise: Promise<string> = (async () => {
      try {
        const network = await fetchStudentNetwork(studentId);
        const resolved =
          extractStudentName(network, studentId) ?? studentId;
        set((prev) => ({
          names: { ...prev.names, [studentId]: resolved },
        }));
        return resolved;
      } finally {
        set((prev) => {
          const rest = { ...prev.inFlight };
          delete rest[studentId];
          return { inFlight: rest };
        });
      }
    })();

    set((prev) => ({
      inFlight: { ...prev.inFlight, [studentId]: promise },
    }));

    return promise;
  },
  ensureNames: (studentIds: string[]) => {
    const uniqueIds = Array.from(
      new Set(
        studentIds.filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        ),
      ),
    );
    uniqueIds.forEach((id) => {
      const state = get();
      if (state.names[id] || state.inFlight[id]) {
        return;
      }
      void state.fetchName(id).catch(() => undefined);
    });
  },
}));

export const useStudentName = (
  studentId?: string | null,
  fallback?: string,
): string => {
  const id = studentId ?? undefined;
  const name = useStudentDirectory((state) =>
    id ? state.names[id] : undefined,
  );
  const fetchName = useStudentDirectory((state) => state.fetchName);

  useEffect(() => {
    if (id && !name) {
      void fetchName(id).catch(() => undefined);
    }
  }, [fetchName, id, name]);

  if (name && name.trim()) {
    return name;
  }
  if (fallback && fallback.trim()) {
    return fallback;
  }
  if (id) {
    return STUDENT_NAME_PLACEHOLDER;
  }
  return "";
};

export const useStudentNames = (
  studentIds: string[],
): Record<string, string> => {
  const directoryNames = useStudentDirectory((state) => state.names);
  const ensureNames = useStudentDirectory((state) => state.ensureNames);

  const uniqueIds = useMemo(
    () =>
      Array.from(
        new Set(
          studentIds.filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          ),
        ),
      ),
    [studentIds],
  );

  useEffect(() => {
    if (uniqueIds.length > 0) {
      ensureNames(uniqueIds);
    }
  }, [ensureNames, uniqueIds]);

  return useMemo(() => {
    const map: Record<string, string> = {};
    uniqueIds.forEach((id) => {
      const value = directoryNames[id];
      if (value) {
        map[id] = value;
      }
    });
    return map;
  }, [directoryNames, uniqueIds]);
};
