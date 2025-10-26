import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CasesTable from "../components/CasesTable";
import CaseTimeline from "../components/CaseTimeline";
import { useCasesStore } from "../store/useCases";
import { useStudentName, useStudentNames } from "../store/useStudentDirectory";

const Cases = () => {
  const cases = useCasesStore((state) => Object.values(state.cases));
  const closeCase = useCasesStore((state) => state.closeCase);
  const updateStatus = useCasesStore((state) => state.updateStatus);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const navigate = useNavigate();

  const activeCases = useMemo(
    () => cases.filter((item) => item.status !== "concluido"),
    [cases],
  );

  const selectedCase = cases.find((item) => item.id === selectedCaseId);
  const caseStudentIds = useMemo(
    () => activeCases.map((item) => item.studentId),
    [activeCases],
  );

  const studentNames = useStudentNames(caseStudentIds);
  const selectedStudentName = useStudentName(selectedCase?.studentId);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary-500">
          Meus Chamados
        </h1>
        <p className="text-sm text-neutral-600">
          Acompanhe até dez alunos simultaneamente. Encerrar um chamado libera
          espaço para novos atendimentos.
        </p>
      </header>

      <CasesTable
        cases={activeCases}
        studentNames={studentNames}
        onInspect={(caseItem) => setSelectedCaseId(caseItem.id)}
        onClose={(caseItem) => {
          closeCase(caseItem.id, "Acompanhamento concluído.");
          if (selectedCaseId === caseItem.id) {
            setSelectedCaseId(undefined);
          }
        }}
        onStatusChange={(caseItem, status) => {
          updateStatus(caseItem.id, status);
          if (status === "concluido" && selectedCaseId === caseItem.id) {
            setSelectedCaseId(undefined);
          }
        }}
        onStudentClick={(studentId) => navigate(`/students/${studentId}`)}
      />

      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        <p>
          Sugestão: mantenha registros breves após cada contato. Use a página de
          detalhes do aluno para registrar chamadas, visitas ou mensagens – isso
          fortalece a continuidade do cuidado intersetorial.
        </p>
        <button
          type="button"
          onClick={() => navigate("/search")}
          className="mt-3 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Buscar novos atendimentos
        </button>
      </div>

      <CaseTimeline
        caseItem={selectedCase}
        studentLabel={selectedStudentName}
        onClose={() => setSelectedCaseId(undefined)}
      />
    </div>
  );
};

export default Cases;
