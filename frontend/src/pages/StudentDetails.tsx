import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchAssignments,
  fetchFamily,
  fetchStudentNetwork,
  fetchStudents,
  generateFamilyInsight,
  generateStudentInsight,
} from "../lib/api";
import { useVolunteerStore } from "../store/useVolunteer";
import InsightCard from "../components/InsightCard";
import FamilyCard from "../components/FamilyCard";
import { useStudentName } from "../store/useStudentDirectory";

const tabOptions = ["perfil", "familia", "rede"] as const;

const StudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabOptions)[number]>("perfil");

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

  const student = studentsQuery.data?.find((item) => item.id === id);
  const studentName = useStudentName(id);

  const familyQuery = useQuery({
    queryKey: ["family", student?.family_id],
    queryFn: () => fetchFamily(student!.family_id),
    enabled: Boolean(student?.family_id),
  });

  const networkQuery = useQuery({
    queryKey: ["network", id],
    queryFn: () => fetchStudentNetwork(id!),
    enabled: Boolean(id),
  });

  const {
    mutate: requestStudentInsight,
    data: studentInsight,
  } = useMutation({
    mutationFn: (studentId: string) => generateStudentInsight(studentId),
  });

  const {
    mutate: requestFamilyInsight,
    data: familyInsight,
  } = useMutation({
    mutationFn: (familyId: string) => generateFamilyInsight(familyId),
  });

  const studentInsightRequestedRef = useRef<string | undefined>();
  const familyInsightRequestedRef = useRef<string | undefined>();

  useEffect(() => {
    if (!student?.id) return;
    if (studentInsightRequestedRef.current === student.id) return;
    studentInsightRequestedRef.current = student.id;
    requestStudentInsight(student.id);
  }, [student?.id, requestStudentInsight]);

  useEffect(() => {
    const familyId = familyQuery.data?.id;
    if (!familyId) return;
    if (familyInsightRequestedRef.current === familyId) return;
    familyInsightRequestedRef.current = familyId;
    requestFamilyInsight(familyId);
  }, [familyQuery.data?.id, requestFamilyInsight]);

  const assignment = useMemo(
    () => assignmentsQuery.data?.find((item) => item.student_id === id),
    [assignmentsQuery.data, id],
  );

  if (!student) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-600">
        Aluno não encontrado nesta zona. Volte para a lista de estudantes.
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary-500">
          {studentName}
        </h1>
        <p className="text-sm text-neutral-600">
          Escola {student.school.school_name} • Turma {student.school.classroom} •
          Turno {student.school.shift}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
        {student.tags.slice(0, 8).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-neutral-200 px-3 py-1 text-neutral-700"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {tabOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              tab === option
                ? "bg-primary-500 text-white"
                : "bg-neutral-200 text-neutral-700"
            }`}
          >
            {option === "perfil" && "Perfil"}
            {option === "familia" && "Família & Serviços"}
            {option === "rede" && "Rede"}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            Indicadores principais
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">Frequência</p>
              <p>
                Faltas nos últimos 30 dias: {student.attendance_last_30d.absences}
              </p>
              <p>Atrasos: {student.attendance_last_30d.delays}</p>
            </div>
            <div className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">Acessibilidade</p>
              <p>
                Uso de cadeira de rodas: {student.disabilities.wheelchair_user ? "sim" : "não"}
              </p>
              <p>Notas: {student.warm_notes ?? "sem observações adicionais"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <a
              href={`tel:${volunteer?.contact.phone ?? ""}`}
              className="rounded-full border border-neutral-300 px-4 py-2 text-neutral-700 hover:border-primary-500 hover:text-primary-500"
            >
              Ligar para responsável
            </a>
            <a
              href={`https://wa.me/${volunteer?.contact.phone?.replace(/\D/g, "") ?? ""}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-neutral-300 px-4 py-2 text-neutral-700 hover:border-primary-500 hover:text-primary-500"
            >
              Abrir WhatsApp
            </a>
          </div>
        </section>
      )}

      {tab === "familia" && familyQuery.data && <FamilyCard family={familyQuery.data} />}

      {tab === "rede" && networkQuery.data && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Rede de apoio</h2>
          <p className="text-sm text-neutral-600">{networkQuery.data.explanation}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Nós</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                {networkQuery.data.nodes.map((node) => (
                  <li key={node.id}>
                    <span className="font-medium text-neutral-900">{node.label}</span>
                    <span className="text-xs text-neutral-500"> • {node.type}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Relações</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                {networkQuery.data.edges.map((edge) => (
                  <li key={edge.id}>
                    {edge.from} → {edge.to} • {edge.type}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {studentInsight && <InsightCard insight={studentInsight} />}
        {familyInsight && <InsightCard insight={familyInsight} />}
      </div>

      {assignment && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <p>
            Você acompanha este aluno desde {new Date(assignment.created_at).toLocaleDateString("pt-BR")}. Racional da atribuição:
          </p>
          <p className="mt-2 text-neutral-700">{assignment.rationale}</p>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
