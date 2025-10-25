import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  fetchAssignments,
  fetchFamily,
  fetchStudentNetwork,
  fetchStudents,
  generateFamilyInsight,
  generateStudentInsight,
  runAssignment,
  syncStudents,
} from "../lib/api";
import haversineKm from "../lib/distance";
import buildSuggestions from "../domain/suggestions";
import { useVolunteerStore } from "../store/useVolunteer";
import { useCasesStore } from "../store/useCases";
import { useMatchDeck } from "../hooks/useMatchDeck";
import MatchDeck, { DeckItem } from "../components/MatchDeck";
import CapacityBar from "../components/CapacityBar";
import FamilyQuickView from "../components/FamilyQuickView";
import InsightCard from "../components/InsightCard";

const DashboardMatch = () => {
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const navigate = useNavigate();
  const acceptCase = useCasesStore((state) => state.acceptCase);
  const activeCount = useCasesStore((state) => state.activeCount());
  const queryClient = useQueryClient();

  const {
    current: currentItem,
    nextItems: upcomingItems,
    replaceItems,
    advance,
    setAnimating: setDeckAnimating,
    isAnimating: deckIsAnimating,
  } = useMatchDeck<DeckItem>();

  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const zone = volunteer?.zone ?? "";

  const studentsQuery = useQuery({
    queryKey: ["students", zone],
    queryFn: () => fetchStudents(zone),
    enabled: Boolean(zone),
    staleTime: 30_000,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", zone],
    queryFn: () => fetchAssignments(zone),
    enabled: Boolean(zone),
    staleTime: 30_000,
  });

  const familyIds = useMemo(() => {
    const ids = new Set<string>();
    studentsQuery.data?.slice(0, 30).forEach((student) => ids.add(student.family_id));
    return Array.from(ids);
  }, [studentsQuery.data]);

  const familiesQueries = useQueries({
    queries: familyIds.map((familyId) => ({
      queryKey: ["family", familyId],
      queryFn: () => fetchFamily(familyId),
      staleTime: 60_000,
      enabled: Boolean(familyId),
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

  const suggestions = useMemo(() => {
    if (!volunteer || !studentsQuery.data) return [];
    return buildSuggestions({
      volunteer,
      students: studentsQuery.data,
      familiesById,
      assignments: assignmentsQuery.data ?? [],
      activeCases: activeCount,
      limit: 10,
    });
  }, [volunteer, studentsQuery.data, familiesById, assignmentsQuery.data, activeCount]);

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Awaited<ReturnType<typeof fetchAssignments>>[number]>();
    assignmentsQuery.data?.forEach((assignment) => map.set(assignment.student_id, assignment));
    return map;
  }, [assignmentsQuery.data]);

  const deckItems = useMemo<DeckItem[]>(() => {
    if (!volunteer || !studentsQuery.data) return [];
    const volunteerCoords = volunteer.coordinates;
    const students = studentsQuery.data;
    return suggestions
      .map((suggestion) => {
        const student = students.find((s) => s.id === suggestion.studentId);
        if (!student) return null;
        const assignment = assignmentsMap.get(student.id);
        const distanceKm =
          assignment?.distance_km ??
          (volunteerCoords && student.coordinates
            ? haversineKm(volunteerCoords, student.coordinates)
            : undefined);
        const deckItem: DeckItem = {
          suggestion,
          student,
          family: familiesById[student.family_id],
          distanceKm,
        };
        return deckItem;
      })
      .filter((item): item is DeckItem => item !== null);
  }, [suggestions, studentsQuery.data, assignmentsMap, familiesById, volunteer]);

  const deckItemsKey = useMemo(
    () => deckItems.map((item) => item.student.id).join("|"),
    [deckItems],
  );

  useEffect(() => {
    replaceItems(deckItems);
  }, [deckItems, deckItemsKey, replaceItems]);

  const { data: currentInsight } = useQuery({
    queryKey: ["student-insight", currentItem?.student.id],
    queryFn: () => generateStudentInsight(currentItem!.student.id),
    enabled: Boolean(currentItem?.student.id),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const nextId = upcomingItems[0]?.student.id;
    if (nextId) {
      void queryClient.prefetchQuery({
        queryKey: ["student-insight", nextId],
        queryFn: () => generateStudentInsight(nextId),
        staleTime: 300_000,
      });
    }
  }, [upcomingItems, queryClient]);

  const syncMutation = useMutation({
    mutationFn: () => syncStudents(zone),
    onSuccess: () => {
      toast.success("Zona sincronizada. Sugestões atualizadas.");
      void queryClient.invalidateQueries({ queryKey: ["students", zone] });
    },
    onError: () => toast.error("Não foi possível sincronizar agora."),
  });

  const assignMutation = useMutation({
    mutationFn: () => runAssignment(zone),
    onSuccess: () => {
      toast.success("Atribuição executada.");
      void queryClient.invalidateQueries({ queryKey: ["assignments", zone] });
      void queryClient.invalidateQueries({ queryKey: ["students", zone] });
    },
    onError: () => toast.error("Não foi possível executar a atribuição."),
  });

  const familyInsightMutation = useMutation({
    mutationFn: (familyId: string) => generateFamilyInsight(familyId),
    onSuccess: () => toast.success("Insight da família gerado."),
    onError: () => toast.error("Não foi possível gerar o insight da família."),
  });

  useEffect(() => {
    if (!detailStudentId) {
      familyInsightMutation.reset();
    }
  }, [detailStudentId, familyInsightMutation]);

  const detailInsightQuery = useQuery({
    queryKey: ["student-insight", detailStudentId],
    queryFn: () => generateStudentInsight(detailStudentId!),
    enabled: Boolean(detailStudentId),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const networkQuery = useQuery({
    queryKey: ["network", detailStudentId],
    queryFn: () => fetchStudentNetwork(detailStudentId!),
    enabled: Boolean(detailStudentId),
  });

  if (!volunteer) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
        Selecione seu perfil de voluntário para acessar os matches do cuidado.
      </div>
    );
  }

  const handleHelp = (item: DeckItem) => {
    const assignment = assignmentsMap.get(item.student.id) ?? {
      student_id: item.student.id,
      volunteer_id: volunteer.id,
      zone: volunteer.zone,
      created_at: new Date().toISOString(),
    };
    const result = acceptCase(assignment, {
      urgency: "media",
      initialEvent: {
        id: `help-${item.student.id}-${Date.now()}`,
        timestamp: dayjs().toISOString(),
        label: "Chamado aceito via Match do Cuidado",
        description: item.suggestion.reason,
        channel: "nota",
      },
    });
    if (!result.success) {
      toast.error("Capacidade máxima de chamados ativos atingida.");
      return false;
    }
    return true;
  };

  const handleDecision = (direction: "left" | "right"): Promise<boolean> => {
    const card = currentItem;
    if (!card) return Promise.resolve(false);

    if (direction === "right") {
      if (activeCount >= 10) {
        toast.error("Limite atingido (10/10). Encerre um chamado para ajudar outro aluno.");
        return Promise.resolve(false);
      }
      const success = handleHelp(card);
      if (success) {
        advance("right");
        navigator.vibrate?.(12);
        toast.success("Chamado adicionado à sua lista.");
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }

    advance("left");
    toast("Vamos para o próximo cuidado.", { icon: "✨" });
    return Promise.resolve(true);
  };

  const detailItem = detailStudentId
    ? deckItems.find((item) => item.student.id === detailStudentId)
    : undefined;

  const detailStudent = detailItem?.student;
  const detailFamily = detailItem?.family;
  const canActOnDetail =
    detailItem && currentItem && detailItem.student.id === currentItem.student.id;

  const handleDetailHelp = async () => {
    const success = await handleDecision("right");
    if (success) {
      setDetailStudentId(null);
    }
  };

  const handleDetailSkip = async () => {
    const success = await handleDecision("left");
    if (success) {
      setDetailStudentId(null);
    }
  };

  const closeDetail = () => setDetailStudentId(null);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-primary-500">
          Olá, {volunteer.name} 👋
        </h1>
        <p className="mx-auto max-w-md text-sm text-neutral-600">
          Deslize para conectar-se a quem precisa de apoio agora. Cada match é uma oportunidade de cuidado acolhedor.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
        <MatchDeck
          current={currentItem ?? null}
          nextItems={upcomingItems}
          insight={currentInsight ? { text: currentInsight.insight, source: currentInsight.source } : undefined}
          canHelp={activeCount < 10}
          isAnimating={deckIsAnimating}
          setAnimating={setDeckAnimating}
          onDecision={handleDecision}
          onDetails={(item) => setDetailStudentId(item.student.id)}
        />

        {activeCount >= 10 && (
          <p className="text-sm font-medium text-warning-700">
            Limite atingido (10/10). Encerre um chamado ativo para liberar novas ajudas.
          </p>
        )}

        <CapacityBar
          used={activeCount}
          total={volunteer.max_students}
          onNavigate={() => navigate("/cases")}
        />

        <div className="flex w-full flex-wrap justify-center gap-3 text-sm text-neutral-700">
          <button
            type="button"
            onClick={() => {
              syncMutation.mutate();
            }}
            className="rounded-full border border-neutral-300 px-4 py-2 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            🔄 Sync da zona
          </button>
          <button
            type="button"
            onClick={() => {
              assignMutation.mutate();
            }}
            className="rounded-full border border-neutral-300 px-4 py-2 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            ⚙️ Atribuição automática
          </button>
          <button
            type="button"
            onClick={() => navigate("/map")}
            className="rounded-full border border-neutral-300 px-4 py-2 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            🗺️ Ver mapa
          </button>
        </div>
      </div>

      {detailStudent && (
        <FamilyQuickView
          student={detailStudent}
          family={detailFamily}
          suggestion={detailItem?.suggestion}
          insight={detailInsightQuery.data}
          familyInsight={familyInsightMutation.data}
          network={networkQuery.data}
          distanceKm={detailItem?.distanceKm}
          canHelp={Boolean(canActOnDetail && activeCount < 10)}
          skipAllowed={Boolean(canActOnDetail)}
          onHelp={() => {
            void handleDetailHelp();
          }}
          onSkip={() => {
            void handleDetailSkip();
          }}
          onClose={closeDetail}
          onGenerateFamilyInsight={() => {
            if (detailFamily) {
              familyInsightMutation.mutate(detailFamily.id);
            }
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {currentInsight && <InsightCard insight={currentInsight} />}
        {familyInsightMutation.data && <InsightCard insight={familyInsightMutation.data} />}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-inner">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-sm text-neutral-600">
          <button
            type="button"
            className="rounded-full px-3 py-1 font-semibold text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={() => navigate("/cases")}
          >
            Meus Chamados
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1 font-semibold text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={() => navigate("/map")}
          >
            Mapa
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1 font-semibold text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={() => {
              syncMutation.mutate();
            }}
          >
            Atualizar sugestões
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DashboardMatch;
