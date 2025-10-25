import type {
  AssignmentRecord,
  FamilyProfile,
  StudentProfile,
  VolunteerProfile,
} from "../types/models";
import haversineKm from "../lib/distance";

export type SuggestionSeverity = "high" | "medium" | "low";

export type SuggestionItem = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  tags: string[];
  score: number;
  reason: string;
  ctaLabel: string;
  distanceKm: number;
};

type SuggestionInputs = {
  volunteer: VolunteerProfile;
  students: StudentProfile[];
  familiesById: Record<string, FamilyProfile | undefined>;
  assignments: AssignmentRecord[];
  activeCases: number;
  limit?: number;
};

const getDistance = (
  volunteer: VolunteerProfile,
  student: StudentProfile,
  assignment?: AssignmentRecord,
) => {
  if (assignment?.distance_km) {
    return assignment.distance_km;
  }
  if (!volunteer.coordinates || !student.coordinates) return 0;
  return haversineKm(volunteer.coordinates, student.coordinates);
};

export const buildSuggestions = ({
  volunteer,
  students,
  familiesById,
  assignments,
  activeCases,
  limit = 10,
}: SuggestionInputs): SuggestionItem[] => {
  if (activeCases >= 10) {
    return [];
  }

  const assignmentByStudent = new Map(
    assignments.map((assignment) => [assignment.student_id, assignment]),
  );

  const items: SuggestionItem[] = [];

  for (const student of students) {
    const assignment = assignmentByStudent.get(student.id);
    const distanceKm = getDistance(volunteer, student, assignment);
    const family = familiesById[student.family_id];
    const tags = new Set<string>(student.tags ?? []);
    let score = 0;
    let reason = "Acompanhamento contínuo recomendado.";
    let ctaLabel = "Ver detalhes";

    const wheelchair = student.disabilities?.wheelchair_user;
    const hasElderlyGuardian = family?.household?.some(
      (member) =>
        member.role === "guardian" &&
        family.eligibility_signals?.includes("elderly_guardian"),
    );

    if (wheelchair && hasElderlyGuardian) {
      score += 40;
      reason =
        "Aluno com necessidade de mobilidade acompanhado por familiar idoso. Avalie apoio no trajeto.";
      ctaLabel = "Solicitar apoio de mobilidade";
      tags.add("mobilidade");
    }

    if (student.attendance_last_30d.absences >= 3) {
      score += 30;
      reason =
        "Faltas repetidas sinalizam barreiras. Um contato acolhedor pode apoiar a presença.";
      if (ctaLabel === "Ver detalhes") {
        ctaLabel = "Enviar mensagem respeitosa";
      }
      tags.add("frequencia");
    }

    const lowIncome = family?.eligibility_signals?.includes("low_income");
    const cadUnicoRegistered =
      family?.external_services?.cad_unico?.registered ?? false;
    if (lowIncome && !cadUnicoRegistered) {
      score += 30;
      reason =
        "Família com renda sensível sem CadÚnico ativo. Considere orientar procura ao CRAS.";
      ctaLabel = "Orientar cadastro CadÚnico";
      tags.add("cadunico");
    }

    if (distanceKm > volunteer.radius_km) {
      score += 20;
      reason =
        "Aluno fora do raio habitual. Reavalie logística ou solicite redistribuição.";
      ctaLabel = "Solicitar reatribuição";
      tags.add("distancia");
    }

    const transporteAtivo = family?.external_services?.others?.some(
      (service) => service.name === "transporte_escolar" && service.active,
    );
    if (
      transporteAtivo &&
      student.attendance_last_30d.absences > 0 &&
      score < 70
    ) {
      score += 15;
      reason =
        "Transporte escolar ativo, mas com faltas recentes. Confirme se o serviço está disponível no turno.";
      ctaLabel = "Confirmar adesão ao transporte";
      tags.add("transporte");
    }

    if (activeCases >= 8 && score > 0) {
      score -= 15;
    }

    if (score === 0) {
      score = 25;
      reason =
        "Caso de acompanhamento leve. Um contato acolhedor fortalece a presença.";
    }

    const computedScore = Math.round(score);
    let severity: SuggestionSeverity = "low";
    if (computedScore >= 60) {
      severity = "high";
    } else if (computedScore >= 40) {
      severity = "medium";
    }

    if (ctaLabel === "Ver detalhes") {
      ctaLabel = severity === "high" ? "Ajudar agora" : "Ver detalhes";
    }

    items.push({
      id: `suggestion-${student.id}`,
      studentId: student.id,
      title: student.id,
      description:
        student.warm_notes ??
        `Aluno da turma ${student.school.classroom} na escola ${student.school.school_name}.`,
      severity,
      tags: Array.from(tags),
      score: computedScore,
      reason,
      ctaLabel,
      distanceKm,
    });
  }

  return items
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.studentId.localeCompare(b.studentId);
    })
    .slice(0, limit);
};

export default buildSuggestions;
