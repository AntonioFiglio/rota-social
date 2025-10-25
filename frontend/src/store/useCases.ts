import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";

import type { AssignmentRecord } from "../types/models";

export type CaseStatus =
  | "novo"
  | "em_andamento"
  | "aguardando"
  | "concluido"
  | "bloqueado";

export type TimelineEvent = {
  id: string;
  timestamp: string;
  label: string;
  description?: string;
  channel?: "whatsapp" | "ligacao" | "visita" | "nota" | "insight";
};

export type CaseItem = {
  id: string;
  studentId: string;
  assignment: AssignmentRecord;
  status: CaseStatus;
  urgency: "alta" | "media" | "baixa";
  lastInteraction?: string;
  timeline: TimelineEvent[];
  createdAt: string;
};

type CasesState = {
  cases: Record<string, CaseItem>;
  acceptCase: (
    assignment: AssignmentRecord,
    opts?: { urgency?: "alta" | "media" | "baixa"; initialEvent?: TimelineEvent },
  ) => { success: boolean; reason?: string };
  closeCase: (studentId: string, note?: string) => void;
  updateStatus: (studentId: string, status: CaseStatus) => void;
  appendTimeline: (studentId: string, event: TimelineEvent) => void;
  activeCount: () => number;
  clear: () => void;
};

const ACTIVE_STATUSES: CaseStatus[] = ["novo", "em_andamento", "aguardando"];

export const useCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      cases: {},
      acceptCase: (assignment, opts) => {
        const state = get();
        const existing = state.cases[assignment.student_id];
        if (!existing && state.activeCount() >= 10) {
          return {
            success: false,
            reason: "capacidade_maxima",
          };
        }

        const now = dayjs().toISOString();
        const entry: CaseItem = existing
          ? {
              ...existing,
              assignment,
              status: "em_andamento",
              urgency: existing.urgency,
              lastInteraction: now,
              timeline: opts?.initialEvent
                ? [...existing.timeline, opts.initialEvent]
                : existing.timeline,
            }
          : {
              id: assignment.student_id,
              studentId: assignment.student_id,
              assignment,
              status: "novo",
              urgency: opts?.urgency ?? "media",
              lastInteraction: now,
              timeline: opts?.initialEvent ? [opts.initialEvent] : [],
              createdAt: now,
            };

        set((prev) => ({
          cases: {
            ...prev.cases,
            [assignment.student_id]: entry,
          },
        }));

        return { success: true };
      },
      closeCase: (studentId, note) => {
        const event: TimelineEvent | undefined = note
          ? {
              id: `close-${studentId}-${Date.now()}`,
              timestamp: dayjs().toISOString(),
              label: "Caso concluído",
              description: note,
            }
          : undefined;

        set((prev) => {
          const found = prev.cases[studentId];
          if (!found) return prev;
          return {
            cases: {
              ...prev.cases,
              [studentId]: {
                ...found,
                status: "concluido",
                lastInteraction: dayjs().toISOString(),
                timeline: event ? [...found.timeline, event] : found.timeline,
              },
            },
          };
        });
      },
      updateStatus: (studentId, status) =>
        set((prev) => {
          const found = prev.cases[studentId];
          if (!found) return prev;
          return {
            cases: {
              ...prev.cases,
              [studentId]: {
                ...found,
                status,
              },
            },
          };
        }),
      appendTimeline: (studentId, event) =>
        set((prev) => {
          const found = prev.cases[studentId];
          if (!found) return prev;
          return {
            cases: {
              ...prev.cases,
              [studentId]: {
                ...found,
                lastInteraction: event.timestamp,
                timeline: [...found.timeline, event],
              },
            },
          };
        }),
      activeCount: () => {
        const state = get();
        return Object.values(state.cases).filter((item) =>
          ACTIVE_STATUSES.includes(item.status),
        ).length;
      },
      clear: () => set({ cases: {} }),
    }),
    {
      name: "portal-voluntario-cases",
    },
  ),
);
