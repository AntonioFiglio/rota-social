import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  fetchAssignments,
  fetchFamily,
  fetchStudents,
} from "../lib/api";
import { useVolunteerStore } from "../store/useVolunteer";
import { useCasesStore } from "../store/useCases";
import buildSuggestions from "../domain/suggestions";
import SearchFilters from "../components/SearchFilters";
import StudentRow from "../components/StudentRow";
import MapView from "../components/MapView";
import haversineKm from "../lib/distance";

const DEFAULT_ZONES = ["Sao Paulo", "Franca", "Goiania"];

const Search = () => {
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const navigate = useNavigate();
  const acceptCase = useCasesStore((state) => state.acceptCase);
  const activeCount = useCasesStore((state) => state.activeCount());

  const [query, setQuery] = useState("");
  const [zone, setZone] = useState(volunteer?.zone ?? DEFAULT_ZONES[0]);
  const [radiusKm, setRadiusKm] = useState(volunteer?.radius_km ?? 8);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [bestForMe, setBestForMe] = useState(false);

  useEffect(() => {
    if (volunteer) {
      setZone(volunteer.zone);
      setRadiusKm(volunteer.radius_km);
    }
  }, [volunteer]);

  const studentsQuery = useQuery({
    queryKey: ["students", zone],
    queryFn: () => fetchStudents(zone),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", zone],
    queryFn: () => fetchAssignments(zone),
  });

  const familyIds = useMemo(() => {
    const ids = new Set<string>();
    studentsQuery.data?.forEach((student) => ids.add(student.family_id));
    return Array.from(ids).slice(0, 60);
  }, [studentsQuery.data]);

  const familiesQueries = useQueries({
    queries: familyIds.slice(0, 60).map((familyId) => ({
      queryKey: ["family", familyId],
      queryFn: () => fetchFamily(familyId),
      staleTime: 60_000,
    })),
  });

  const familiesMap = useMemo(() => {
    const map: Record<string, Awaited<ReturnType<typeof fetchFamily>>> = {};
    familiesQueries.forEach((query) => {
      if (query.data) {
        map[query.data.id] = query.data;
      }
    });
    return map;
  }, [familiesQueries]);

  const filteredStudents = useMemo(() => {
    if (!studentsQuery.data || !volunteer) return [];
    const lowerQuery = query.trim().toLowerCase();
    return studentsQuery.data
      .filter((student) => {
        if (accessibleOnly && !student.disabilities?.wheelchair_user) {
          return false;
        }
        if (lowerQuery) {
          const matchesId = student.id.toLowerCase().includes(lowerQuery);
          const matchesTag = student.tags.some((tag) =>
            tag.toLowerCase().includes(lowerQuery),
          );
          if (!matchesId && !matchesTag) return false;
        }
        if (!student.coordinates || !volunteer.coordinates) return true;
        const distance = haversineKm(volunteer.coordinates, student.coordinates);
        return distance <= radiusKm;
      })
      .map((student) => {
        const distance =
          volunteer.coordinates && student.coordinates
            ? haversineKm(volunteer.coordinates, student.coordinates)
            : 0;
        return { student, distance };
      });
  }, [studentsQuery.data, volunteer, query, accessibleOnly, radiusKm]);

  const suggestions = useMemo(() => {
    if (!volunteer || !studentsQuery.data) return [];
    return buildSuggestions({
      volunteer,
      students: studentsQuery.data,
      familiesById: familiesMap,
      assignments: assignmentsQuery.data ?? [],
      activeCases: activeCount,
      limit: studentsQuery.data.length,
    });
  }, [volunteer, studentsQuery.data, familiesMap, assignmentsQuery.data, activeCount]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    suggestions.forEach((suggestion) => {
      map.set(suggestion.studentId, suggestion.score);
    });
    return map;
  }, [suggestions]);

  const sortedStudents = useMemo(() => {
    const list = filteredStudents.slice();
    if (bestForMe) {
      list.sort((a, b) => {
        const scoreA = scoreMap.get(a.student.id) ?? 0;
        const scoreB = scoreMap.get(b.student.id) ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.distance - b.distance;
      });
    } else {
      list.sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [filteredStudents, bestForMe, scoreMap]);

  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedStudents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
  });

  const handleAccept = (studentId: string) => {
    const assignment = assignmentsQuery.data?.find(
      (record) => record.student_id === studentId,
    );
    const result = acceptCase(
      assignment ?? {
        student_id: studentId,
        volunteer_id: volunteer?.id ?? "",
        zone: zone,
        created_at: new Date().toISOString(),
      },
    );
    if (!result.success) {
      window.alert("Limite de 10 chamados ativos alcançado.");
      return;
    }
    navigate(`/students/${studentId}`);
  };

  if (!volunteer) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-600">
        Selecione um voluntário para habilitar a busca de atendimentos.
      </div>
    );
  }

  const mapSuggestedStudents = sortedStudents
    .slice(0, 10)
    .map((item) => item.student);

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-4">
        <SearchFilters
          query={query}
          zone={zone}
          radiusKm={radiusKm}
          maxRadiusKm={volunteer?.radius_km ?? 10}
          accessibleOnly={accessibleOnly}
          bestForMe={bestForMe}
          availableZones={DEFAULT_ZONES}
          onQueryChange={setQuery}
          onZoneChange={setZone}
          onRadiusChange={setRadiusKm}
          onAccessibleToggle={() => setAccessibleOnly((prev) => !prev)}
          onBestForMeToggle={() => setBestForMe((prev) => !prev)}
        />

        <div
          ref={parentRef}
          className="h-[520px] overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const { student, distance } = sortedStudents[virtualRow.index];
              return (
                <div
                  key={student.id}
                  className="absolute left-0 right-0"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <StudentRow
                    student={student}
                    distanceKm={distance}
                    onSelect={(id) => navigate(`/students/${id}`)}
                    onAccept={handleAccept}
                    disabled={activeCount >= 10}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MapView
          volunteer={volunteer}
          studentsSuggested={mapSuggestedStudents}
          studentsAssigned={[]}
          onStudentClick={(studentId) => navigate(`/students/${studentId}`)}
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Dica: use os filtros para priorizar alunos dentro do seu raio de
          deslocamento. A opção &ldquo;Melhores para mim&rdquo; combina distância e fatores
          socioeducacionais.
        </div>
      </div>
    </div>
  );
};

export default Search;
