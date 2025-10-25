import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchAssignments, fetchFamily, fetchStudents } from "../lib/api";
import buildSuggestions from "../domain/suggestions";
import MapView from "../components/MapView";
import { useVolunteerStore } from "../store/useVolunteer";

const MapPage = () => {
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const navigate = useNavigate();
  const zone = volunteer?.zone ?? "";

  const studentsQuery = useQuery({
    queryKey: ["students", zone],
    queryFn: () => fetchStudents(zone),
    enabled: Boolean(zone),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", zone],
    queryFn: () => fetchAssignments(zone),
    enabled: Boolean(zone),
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
      enabled: Boolean(familyId),
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

  if (!volunteer) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
        Selecione um voluntário para visualizar o mapa de atuação.
      </div>
    );
  }

  const suggestions = buildSuggestions({
    volunteer,
    students: studentsQuery.data ?? [],
    familiesById,
    assignments: assignmentsQuery.data ?? [],
    activeCases: 0,
    limit: 10,
  });

  const suggestedStudents = suggestions
    .map((s) => studentsQuery.data?.find((student) => student.id === s.studentId))
    .filter((student): student is NonNullable<typeof student> => Boolean(student));

  const assignedToVolunteer = (assignmentsQuery.data ?? [])
    .filter((assignment) => assignment.volunteer_id === volunteer.id)
    .map((assignment) => ({
      student: studentsQuery.data?.find((student) => student.id === assignment.student_id),
      assignment,
    }))
    .filter((item): item is { student: NonNullable<typeof item.student>; assignment: typeof item.assignment } => Boolean(item.student));

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary-500">Mapa de atuação</h1>
        <p className="text-sm text-neutral-600">
          Visualize os alunos sugeridos e já atribuídos dentro do seu raio. Use este mapa para planejar deslocamentos seguros.
        </p>
      </header>

      <MapView
        volunteer={volunteer}
        studentsSuggested={suggestedStudents}
        studentsAssigned={assignedToVolunteer}
        onStudentClick={(studentId) => navigate(`/students/${studentId}`)}
      />
    </div>
  );
};

export default MapPage;
