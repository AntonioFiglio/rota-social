import type { SuggestionItem } from "../domain/suggestions";
import type {
  FamilyProfile,
  NetworkResponse,
  StudentProfile,
} from "../types/models";
import { useStudentName } from "../store/useStudentDirectory";

type FamilyQuickViewProps = {
  student: StudentProfile;
  family?: FamilyProfile;
  suggestion?: SuggestionItem;
  insight?: { insight: string; source?: string };
  familyInsight?: { insight: string; source?: string };
  network?: NetworkResponse;
  distanceKm?: number;
  canHelp: boolean;
  skipAllowed?: boolean;
  onHelp: () => void;
  onSkip: () => void;
  onClose: () => void;
  onGenerateFamilyInsight: () => void;
};

const chipClass = (active: boolean) =>
  active
    ? "rounded-full bg-success-500/15 px-2 py-1 text-xs font-medium text-success-700"
    : "rounded-full bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700";

const FamilyQuickView = ({
  student,
  family,
  suggestion,
  insight,
  familyInsight,
  network,
  distanceKm,
  canHelp,
  skipAllowed = true,
  onHelp,
  onSkip,
  onClose,
  onGenerateFamilyInsight,
}: FamilyQuickViewProps) => {
  const services = family?.external_services;
  const eligibility = family?.eligibility_signals ?? [];
  const studentName = useStudentName(student.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-500">
              Detalhes do estudante
            </p>
            <h2 className="text-xl font-semibold text-neutral-900">
              {studentName}
            </h2>
            <p className="text-xs text-neutral-600">
              {student.school.school_name} • {student.zone} • {distanceKm ? `${distanceKm.toFixed(1)} km` : "distância em avaliação"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </header>

        <section className="mt-4 space-y-3 text-sm text-neutral-700">
          <div className="space-y-2 rounded-2xl bg-neutral-100 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Contexto rápido</h3>
              <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] font-semibold text-primary-600">
                {suggestion?.severity === "high"
                  ? "Severidade alta"
                  : suggestion?.severity === "medium"
                  ? "Severidade média"
                  : "Severidade baixa"}
              </span>
            </div>
            <p className="text-sm text-neutral-800">
              <span className="font-medium">💡 Insight:</span> {insight?.insight ?? "Gerando insight respeitoso..."}
            </p>
            {insight?.source && (
              <p className="text-[11px] text-neutral-500">Fonte: {insight.source}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-neutral-200 px-3 py-2">
                Faltas (30d): {student.attendance_last_30d.absences}
              </div>
              <div className="rounded-lg border border-neutral-200 px-3 py-2">
                Distância: {distanceKm ? `${distanceKm.toFixed(1)} km` : "---"}
              </div>
              <div className="rounded-lg border border-neutral-200 px-3 py-2">
                Score: {suggestion?.score ?? "—"}
              </div>
              <div className="rounded-lg border border-neutral-200 px-3 py-2">
                Acessibilidade: {student.disabilities?.wheelchair_user ? "cadeira de rodas" : "sem registro"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestion?.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] font-medium text-primary-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl bg-neutral-100 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">Família & Serviços</h3>
            <div className="flex flex-wrap gap-2">
              <span className={chipClass(services?.sus?.registered ?? false)}>SUS {services?.sus?.registered ? "✔" : "—"}</span>
              <span className={chipClass(services?.cad_unico?.registered ?? false)}>CadÚnico {services?.cad_unico?.registered ? "✔" : "—"}</span>
              <span className={chipClass(services?.bolsa_familia?.beneficiary ?? false)}>Bolsa Família {services?.bolsa_familia?.beneficiary ? "✔" : "—"}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
              {eligibility.length ? (
                eligibility.map((signal) => (
                  <span key={signal} className="rounded-full bg-neutral-200 px-2 py-1">
                    {signal}
                  </span>
                ))
              ) : (
                <span className="text-neutral-500">Sem sinais adicionais</span>
              )}
            </div>
            <p className="text-xs text-neutral-600">
              {family?.warm_notes ?? "Nenhuma observação adicional da família."}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-inner">
            <h3 className="text-sm font-semibold text-neutral-900">Ações sugeridas</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-700">
              <li>{suggestion?.reason ?? "Registrar contato acolhedor."}</li>
              <li>{suggestion?.ctaLabel ?? "Avaliar apoio necessário."}</li>
              <li>
                {student.disabilities?.wheelchair_user
                  ? "Verificar logística de mobilidade com a família."
                  : "Reforçar acolhimento e presença nas próximas semanas."}
              </li>
            </ul>
            <button
              type="button"
              onClick={onGenerateFamilyInsight}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Gerar insight da família
            </button>
            {familyInsight && (
              <p className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
                <span className="font-medium">Insight família:</span> {familyInsight.insight}
                {familyInsight.source && (
                  <span className="block text-[11px] text-neutral-500">Fonte: {familyInsight.source}</span>
                )}
              </p>
            )}
          </div>

          {network?.edges?.length ? (
            <div className="rounded-2xl bg-neutral-100 p-4 text-xs text-neutral-700">
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Rede mapeada</h3>
              <ul className="space-y-1">
                {network.edges.slice(0, 6).map((edge) => (
                  <li key={edge.id}>
                    {edge.from} → {edge.to} • {edge.type}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <footer className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <button
            type="button"
            onClick={onSkip}
            disabled={!skipAllowed}
            className="col-span-1 rounded-xl border border-warning-500/60 py-2 font-semibold text-warning-700 transition hover:border-warning-500 hover:text-warning-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
          >
            ❌ Pular
          </button>
          <button
            type="button"
            onClick={onHelp}
            disabled={!canHelp}
            className="col-span-2 rounded-xl bg-success-500 py-2 font-semibold text-white transition hover:bg-success-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            💚 Ajudar
          </button>
          {!canHelp && (
            <p className="col-span-3 text-center text-[11px] font-medium text-warning-700">
              Limite atingido (10/10). Finalize um chamado ativo para liberar este apoio.
            </p>
          )}
          {!skipAllowed && (
            <p className="col-span-3 text-center text-[11px] font-medium text-neutral-500">
              Este detalhamento é apenas para consulta. Volte ao card atual para decidir.
            </p>
          )}
        </footer>

        <p className="mt-3 text-center text-[11px] uppercase tracking-wide text-neutral-400">
          POC — dados sintéticos • Nenhuma decisão automatizada
        </p>
      </div>
    </div>
  );
};

export default FamilyQuickView;
