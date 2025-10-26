import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import MatchDeck, { DeckItem } from "../components/MatchDeck";
import CapacityBar from "../components/CapacityBar";
import FamilyQuickView from "../components/FamilyQuickView";
import type { StudentProfile } from "../types/models";
import logoImage from "../assets/logo.png";

const DashboardMatch: React.FC = () => {
  const volunteer = useVolunteerStore((s) => s.volunteer);
  const navigate = useNavigate();
  const acceptCase = useCasesStore((s) => s.acceptCase);
  const activeCount = useCasesStore((s) => s.activeCount());
  const queryClient = useQueryClient();

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  // Ao trocar o voluntário, zera descartes
  useEffect(() => {
    setDismissedIds([]);
  }, [volunteer?.id]);

  const zone = volunteer?.zone ?? "";

  // --- Dados base
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

  // --- Famílias
  const studentsData = useMemo(
    () => studentsQuery.data ?? [],
    [studentsQuery.data],
  );
  const assignmentsData = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data],
  );
  const hasStudents = studentsData.length > 0;

  const familyIds = useMemo(() => {
    const ids = new Set<string>();
    studentsData.forEach((s) => ids.add(s.family_id));
    return Array.from(ids).slice(0, 60);
  }, [studentsData]);

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
    for (const q of familiesQueries) if (q.data) map[q.data.id] = q.data;
    return map;
  }, [familiesQueries]);

  const studentsById = useMemo(() => {
    const map = new Map<string, StudentProfile>();
    studentsData.forEach((s) => map.set(s.id, s));
    return map;
  }, [studentsData]);

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Awaited<ReturnType<typeof fetchAssignments>>[number]>();
    assignmentsData.forEach((a) => map.set(a.student_id, a));
    return map;
  }, [assignmentsData]);

  // --- Sugestões e Deck
  const suggestions = useMemo(() => {
    if (!volunteer || !hasStudents) return [];
    return buildSuggestions({
      volunteer,
      students: studentsData,
      familiesById,
      assignments: assignmentsData,
      activeCases: activeCount,
      limit: 10,
    });
  }, [volunteer, hasStudents, studentsData, familiesById, assignmentsData, activeCount]);

  const allDeckItems = useMemo<DeckItem[]>(() => {
    if (!volunteer || !hasStudents) return [];
    const volunteerCoords = volunteer.coordinates;

    return suggestions
      .map((sg) => {
        const student = studentsById.get(sg.studentId);
        if (!student) return null;

        const assignment = assignmentsMap.get(student.id);
        const distanceKm =
          assignment?.distance_km ??
          (volunteerCoords && student.coordinates
            ? haversineKm(volunteerCoords, student.coordinates)
            : undefined);

        return {
          suggestion: sg,
          student,
          family: familiesById[student.family_id],
          distanceKm,
        } as DeckItem;
      })
      .filter((x): x is DeckItem => x !== null);
  }, [suggestions, studentsById, assignmentsMap, familiesById, volunteer, hasStudents]);

  const suggestionIdsSet = useMemo(
    () => new Set(allDeckItems.map((i) => i.student.id)),
    [allDeckItems]
  );

  const dismissedSet = useMemo(() => {
    const filtered = dismissedIds.filter((id) => suggestionIdsSet.has(id));
    return new Set(filtered);
  }, [dismissedIds, suggestionIdsSet]);

  const activeDeck = useMemo(
    () => allDeckItems.filter((i) => !dismissedSet.has(i.student.id)).slice(0, 10),
    [allDeckItems, dismissedSet]
  );

  const currentItem = activeDeck[0] ?? null;
  const currentStudentId = currentItem?.student.id ?? null;
  const nextItems = useMemo(() => activeDeck.slice(1, 3), [activeDeck]);
  const canHelpMore = Boolean(volunteer) && activeCount < (volunteer?.max_students ?? 0);

  // Insight atual
  const { data: currentInsight } = useQuery({
    queryKey: ["student-insight", currentStudentId],
    queryFn: () => {
      if (!currentStudentId) throw new Error("Aluno indisponível para insight.");
      return generateStudentInsight(currentStudentId);
    },
    enabled: Boolean(currentStudentId),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  // Prefetch do próximo — depende só do ID (evita loop)
  const nextStudentId = useMemo(
    () => (activeDeck.length > 1 ? activeDeck[1].student.id : null),
    [activeDeck]
  );

  useEffect(() => {
    if (!nextStudentId) return;
    void queryClient.prefetchQuery({
      queryKey: ["student-insight", nextStudentId],
      queryFn: () => generateStudentInsight(nextStudentId),
      staleTime: 300_000,
    });
  }, [nextStudentId, queryClient]);

  // --- Mutations
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

  // Reset seguro do insight da família
  const familyResetRef = useRef(familyInsightMutation.reset);
  useEffect(() => {
    familyResetRef.current = familyInsightMutation.reset;
  }, [familyInsightMutation.reset]);

  useEffect(() => {
    if (!detailStudentId) familyResetRef.current?.();
  }, [detailStudentId]);

  // Drawer de detalhes
  const detailItem = useMemo(() => {
    if (!detailStudentId) return undefined;
    return (
      activeDeck.find((i) => i.student.id === detailStudentId) ??
      allDeckItems.find((i) => i.student.id === detailStudentId)
    );
  }, [detailStudentId, activeDeck, allDeckItems]);

  const detailStudent = detailItem?.student;
  const detailFamily = detailItem?.family;
  const canActOnDetail =
    Boolean(detailItem && currentItem && detailItem.student.id === currentItem.student.id);

  const detailInsightQuery = useQuery({
    queryKey: ["student-insight", detailStudentId],
    queryFn: () => {
      if (!detailStudentId) throw new Error("Aluno indisponível.");
      return generateStudentInsight(detailStudentId);
    },
    enabled: Boolean(detailStudentId),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const networkQuery = useQuery({
    queryKey: ["network", detailStudentId],
    queryFn: () => {
      if (!detailStudentId) throw new Error("Rede indisponível.");
      return fetchStudentNetwork(detailStudentId);
    },
    enabled: Boolean(detailStudentId),
  });

  // Ações
  const markDismissed = useCallback((studentId: string) => {
    setDismissedIds((prev) => (prev.includes(studentId) ? prev : [...prev, studentId]));
  }, []);

  const handleHelp = useCallback(
    (item: DeckItem) => {
      if (!volunteer) return false;

      const limit = volunteer.max_students;
      if (activeCount >= limit) {
        toast.error(`Limite atingido (${activeCount}/${limit}). Encerre um chamado ativo para liberar espaço.`);
        return false;
      }

      const assignment =
        assignmentsMap.get(item.student.id) ?? {
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

      markDismissed(item.student.id);
      navigator.vibrate?.(12);
      toast.success("Chamado adicionado aos seus atendimentos.");
      return true;
    },
    [acceptCase, activeCount, assignmentsMap, markDismissed, volunteer]
  );

  const handleSkip = useCallback(
    (item: DeckItem) => {
      markDismissed(item.student.id);
      toast("Seguimos para o próximo cuidado.", { icon: "✨" });
      return true;
    },
    [markDismissed]
  );

  const handleDecision = useCallback(
    (direction: "left" | "right") => {
      if (!currentItem) return Promise.resolve(false);
      const success = direction === "right" ? handleHelp(currentItem) : handleSkip(currentItem);
      return Promise.resolve(success);
    },
    [currentItem, handleHelp, handleSkip]
  );

  const handleDetailHelp = useCallback(() => {
    if (!detailItem) return;
    const ok = handleHelp(detailItem);
    if (ok) setDetailStudentId(null);
  }, [detailItem, handleHelp]);

  const handleDetailSkip = useCallback(() => {
    if (!detailItem) return;
    const ok = handleSkip(detailItem);
    if (ok) setDetailStudentId(null);
  }, [detailItem, handleSkip]);

  // Título amigável
  useEffect(() => {
    if (!volunteer) return;
    const prev = document.title;
    document.title = `Match do Cuidado • ${volunteer.name}`;
    return () => {
      document.title = prev || "Portal do Voluntário";
    };
  }, [volunteer]);

  if (!volunteer) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-neutral-100 px-6 text-center text-neutral-600">
        Selecione seu perfil de voluntário para acessar os matches do cuidado.
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Enhanced Logo Component */}
          <div className="group cursor-pointer relative overflow-hidden rounded-xl p-3 transition-all duration-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-xl hover:shadow-blue-200/40">
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <img 
                  src={logoImage} 
                  alt="RotaSocial Logo" 
                  className="h-8 w-8 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg group-hover:drop-shadow-2xl filter group-hover:brightness-110 group-hover:saturate-150"
                />
                {/* Multi-layered glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700 blur-lg scale-150"></div>
                <div className="absolute inset-0 bg-blue-300 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 blur-sm scale-125"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent transition-all duration-700 group-hover:scale-115 group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500 drop-shadow-sm group-hover:drop-shadow-md">
                RotaSocial
              </h1>
            </div>
            
            {/* Advanced particle system */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none overflow-hidden rounded-xl">
              {/* Primary particles */}
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-ping shadow-xl" style={{animationDelay: '0ms', animationDuration: '1.8s'}}></div>
              <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full animate-ping shadow-lg" style={{animationDelay: '300ms', animationDuration: '2.1s'}}></div>
              <div className="absolute top-3/4 left-2/3 w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-ping shadow-md" style={{animationDelay: '600ms', animationDuration: '1.5s'}}></div>
              <div className="absolute top-1/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping shadow-lg" style={{animationDelay: '900ms', animationDuration: '1.9s'}}></div>
              <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-full animate-ping shadow-sm" style={{animationDelay: '1200ms', animationDuration: '1.7s'}}></div>
              <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-gradient-to-r from-indigo-300 to-purple-400 rounded-full animate-ping" style={{animationDelay: '1500ms', animationDuration: '1.3s'}}></div>
              
              {/* Floating sparkles */}
              <div className="absolute top-1/6 left-1/6 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse opacity-80 shadow-sm" style={{animationDelay: '400ms', animationDuration: '2.5s'}}></div>
              <div className="absolute bottom-1/6 right-1/6 w-1 h-1 bg-yellow-200 rounded-full animate-pulse opacity-70" style={{animationDelay: '800ms', animationDuration: '3s'}}></div>
              <div className="absolute top-1/2 right-1/6 w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-90" style={{animationDelay: '1100ms', animationDuration: '2.2s'}}></div>
              
              {/* Expanding ripples */}
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-blue-300 rounded-full opacity-0 group-hover:opacity-30 group-hover:scale-150 transition-all duration-1200 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-indigo-200 rounded-full opacity-0 group-hover:opacity-20 group-hover:scale-200 transition-all duration-1800 -translate-x-1/2 -translate-y-1/2" style={{transitionDelay: '300ms'}}></div>
              <div className="absolute top-1/2 left-1/2 w-28 h-28 border border-purple-100 rounded-full opacity-0 group-hover:opacity-10 group-hover:scale-250 transition-all duration-2200 -translate-x-1/2 -translate-y-1/2" style={{transitionDelay: '600ms'}}></div>
            </div>
          </div>
          
          <div className="h-8 w-px bg-neutral-200" />
          <div>
            <p className="text-xs text-neutral-500">Olá,</p>
            <h2 className="text-lg font-semibold text-neutral-900">
              {volunteer.name}
            </h2>
          </div>
        </div>

      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        {currentItem ? (
          <>
            <MatchDeck
              current={currentItem}
              nextItems={nextItems}
              insight={
                currentInsight
                  ? {
                      text: currentInsight.insight,
                      source: currentInsight.source,
                    }
                  : undefined
              }
              canHelp={canHelpMore}
              onHelp={() => handleDecision("right")}
              onSkip={() => handleDecision("left")}
              onDetails={(item) => setDetailStudentId(item.student.id)}
            />
            <div className="w-full max-w-sm rounded-full bg-white/80 px-4 py-2 text-center text-xs font-semibold text-neutral-500 shadow-sm">
              Arraste para ajudar ou pular • Toque em “Ver mais” para detalhes
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-600 shadow-sm">
            <p className="text-base font-medium text-neutral-900">
              Tudo em dia! ✅
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Sincronize a zona para buscar novas sugestões ou aguarde novas notificações.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 bg-white px-4 py-4">
        <CapacityBar
          used={activeCount}
          total={volunteer.max_students}
          onNavigate={() => navigate("/cases")}
        />
      </footer>

      {detailStudent && detailItem && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <FamilyQuickView
            student={detailStudent}
            family={detailFamily}
            suggestion={detailItem.suggestion}
            insight={detailInsightQuery.data}
            familyInsight={familyInsightMutation.data}
            network={networkQuery.data}
            distanceKm={detailItem.distanceKm}
            canHelp={Boolean(canActOnDetail && activeCount < volunteer.max_students)}
            skipAllowed={Boolean(canActOnDetail)}
            onHelp={handleDetailHelp}
            onSkip={handleDetailSkip}
            onClose={() => setDetailStudentId(null)}
            onGenerateFamilyInsight={() => {
              if (detailFamily) familyInsightMutation.mutate(detailFamily.id);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardMatch;
