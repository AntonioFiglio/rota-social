import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchAssignments,
  fetchFamily,
  fetchStudents,
  generateStudentInsight,
  runAssignment,
  syncStudents,
} from "../lib/api";
import { useVolunteerStore } from "../store/useVolunteer";
import { useCasesStore } from "../store/useCases";
import buildSuggestions from "../domain/suggestions";
import SuggestionsPanel from "../components/SuggestionsPanel";
import CapacityBar from "../components/CapacityBar";
import MapView from "../components/MapView";
import InsightCard from "../components/InsightCard";

const Overview = () => {
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const acceptCase = useCasesStore((state) => state.acceptCase);
  const activeCount = useCasesStore((state) => state.activeCount());
  const cases = useCasesStore((state) => state.cases);
  const timelineFeed = useMemo(() => {
    return Object.values(cases)
      .flatMap((item) => item.timeline)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 5);
  }, [cases]);

  const zone = volunteer?.zone ?? "";

  const studentsQuery = useQuery({
    queryKey: ["students", zone],
    queryFn: () => fetchStudents(zone),
    enabled: Boolean(volunteer),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", zone],
    queryFn: () => fetchAssignments(zone),
    enabled: Boolean(volunteer),
  });

  const familyIds = useMemo(() => {
    const ids = new Set<string>();
    studentsQuery.data?.forEach((student) => ids.add(student.family_id));
    return Array.from(ids).slice(0, 40);
  }, [studentsQuery.data]);

  const familiesQueries = useQueries({
    queries: familyIds.map((familyId) => ({
      queryKey: ["family", familyId],
      queryFn: () => fetchFamily(familyId),
      enabled: Boolean(volunteer),
      staleTime: 60_000,
    })),
  });

  const familiesById = useMemo(() => {
    const map: Record<string, Awaited<ReturnType<typeof fetchFamily>>> = {};
    familiesQueries.forEach((query) => {
      if (query.data) {
        map[query.data.id] = query.data;
      }
    });
    return map;
  }, [familiesQueries]);

  const assignedToVolunteer = useMemo(() => {
    if (!volunteer || !assignmentsQuery.data || !studentsQuery.data) {
      return [];
    }
    return assignmentsQuery.data
      .filter((assignment) => assignment.volunteer_id === volunteer.id)
      .map((assignment) => ({
        student: studentsQuery.data!.find(
          (student) => student.id === assignment.student_id,
        ),
        assignment,
      }))
      .filter((item): item is { student: NonNullable<typeof item.student>; assignment: typeof item.assignment } => Boolean(item.student));
  }, [assignmentsQuery.data, studentsQuery.data, volunteer]);

  const suggestions = useMemo(() => {
    if (!volunteer || !studentsQuery.data) return [];
    return buildSuggestions({
      volunteer,
      students: studentsQuery.data,
      familiesById,
      assignments: assignmentsQuery.data ?? [],
      activeCases: activeCount,
    });
  }, [volunteer, studentsQuery.data, familiesById, assignmentsQuery.data, activeCount]);

  const syncMutation = useMutation({
    mutationFn: () => syncStudents(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", zone] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => runAssignment(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", zone] });
      queryClient.invalidateQueries({ queryKey: ["students", zone] });
    },
  });

  const insightMutation = useMutation({
    mutationFn: (studentId: string) => generateStudentInsight(studentId),
  });

  if (!volunteer) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-600">
        Selecione um voluntário para acessar sua visão geral.
      </div>
    );
  }

  const handleAccept = (studentId: string) => {
    const assignment = assignmentsQuery.data?.find(
      (record) => record.student_id === studentId,
    );
    let selectedAssignment = assignment;
    if (!assignment) {
      selectedAssignment = {
        student_id: studentId,
        volunteer_id: volunteer.id,
        zone: volunteer.zone,
        created_at: new Date().toISOString(),
      };
    }
    const result = acceptCase(selectedAssignment!, {
      initialEvent: {
        id: `accept-${studentId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        label: "Chamado aceito pelo voluntário",
        description: "Acompanhamento iniciado pelo portal.",
        channel: "nota",
      },
    });
    if (!result.success) {
      window.alert("Limite de 10 chamados ativos atingido. Conclua algum caso antes de aceitar novos.");
      return;
    }
    navigate(`/students/${studentId}`);
  };

  const handleInsight = (studentId: string) => {
    insightMutation.mutate(studentId, {
      onSuccess: (insight) => {
        window.alert(insight.insight);
      },
      onError: () => {
        window.alert("Não foi possível gerar o insight agora. Tente novamente em instantes.");
      },
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SuggestionsPanel
          suggestions={suggestions}
          onAccept={handleAccept}
          onDetails={(studentId) => navigate(`/students/${studentId}`)}
          onInsight={handleInsight}
          disabled={activeCount >= 10}
        />
        <div className="flex flex-col gap-4">
          <CapacityBar
            used={activeCount}
            total={volunteer.max_students}
            onNavigate={() => navigate("/cases")}
          />

          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Ferramentas rápidas
              </h2>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <button
                type="button"
                onClick={() => syncMutation.mutate()}
                className="rounded-full bg-primary-500 px-4 py-2 font-semibold text-white transition hover:bg-primary-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Sync da minha zona
              </button>
              <button
                type="button"
                onClick={() => assignMutation.mutate()}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Executar atribuição automática
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">
              Preview de interações
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {timelineFeed.length === 0 ? (
                <li className="text-neutral-500">
                  Nenhuma interação registrada ainda. Cada contato realizado
                  pode ser anotado na página de detalhes do aluno.
                </li>
              ) : (
                timelineFeed.map((event) => (
                  <li key={event.id} className="rounded-lg bg-neutral-100 px-3 py-2">
                    <span className="text-xs text-neutral-500">
                      {new Date(event.timestamp).toLocaleString("pt-BR")}
                    </span>
                    <p className="font-semibold text-neutral-800">
                      {event.label}
                    </p>
                    {event.description && (
                      <p className="text-neutral-600">{event.description}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>

          {insightMutation.data && <InsightCard insight={insightMutation.data} />}
        </div>
      </div>

      <MapView
        volunteer={volunteer}
        studentsSuggested={suggestions
          .map((item) =>
            studentsQuery.data?.find((student) => student.id === item.studentId),
          )
          .filter((student): student is NonNullable<typeof student> => Boolean(student))}
        studentsAssigned={assignedToVolunteer}
        onStudentClick={(studentId) => navigate(`/students/${studentId}`)}
      />
    </div>
  );
};

export default Overview;
