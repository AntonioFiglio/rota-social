import dayjs from "dayjs";

import type { CaseItem, CaseStatus } from "../store/useCases";

type CasesTableProps = {
  cases: CaseItem[];
  onInspect: (caseItem: CaseItem) => void;
  onClose: (caseItem: CaseItem) => void;
  onStatusChange: (caseItem: CaseItem, status: CaseStatus) => void;
};

const statusLabels: Record<CaseStatus, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  aguardando: "Aguardando retorno",
  concluido: "Concluído",
  bloqueado: "Bloqueado",
};

const CasesTable = ({
  cases,
  onInspect,
  onClose,
  onStatusChange,
}: CasesTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Aluno</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Urgência</th>
            <th className="px-4 py-3 font-semibold">Última interação</th>
            <th className="px-4 py-3 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {cases.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-neutral-500"
              >
                Nenhum chamado ativo. Use a busca ou as sugestões para iniciar
                um atendimento.
              </td>
            </tr>
          ) : (
            cases.map((caseItem) => (
              <tr key={caseItem.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-900">
                  {caseItem.studentId}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={caseItem.status}
                    onChange={(event) =>
                      onStatusChange(
                        caseItem,
                        event.target.value as CaseStatus,
                      )
                    }
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    {(Object.keys(statusLabels) as CaseStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-700">
                  {caseItem.urgency}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {caseItem.lastInteraction
                    ? dayjs(caseItem.lastInteraction).format(
                        "DD/MM/YYYY HH:mm",
                      )
                    : "—"}
                </td>
                <td className="flex flex-wrap gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onInspect(caseItem)}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    Ver timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => onClose(caseItem)}
                    className="rounded-full bg-success-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-success-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2"
                  >
                    Encerrar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CasesTable;
