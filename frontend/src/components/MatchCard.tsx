import { memo, useMemo } from "react";
import clsx from "clsx";

import type {
  FamilyProfile,
  StudentProfile,
} from "../types/models";
import type { SuggestionItem } from "../domain/suggestions";

type MatchCardInsight = {
  text: string;
  source?: string;
};

type MatchCardProps = {
  student: StudentProfile;
  studentName: string;
  family?: FamilyProfile;
  suggestion: SuggestionItem;
  insight?: MatchCardInsight;
  distanceKm?: number;
  canHelp: boolean;
  onHelp: () => void;
  onSkip: () => void;
  onSeeMore: () => void;
};

const severityStyles: Record<
  SuggestionItem["severity"],
  { bg: string; text: string; label: string }
> = {
  high: {
    bg: "bg-amber-200/80",
    text: "text-amber-900",
    label: "Severidade Alta",
  },
  medium: {
    bg: "bg-blue-200/80",
    text: "text-blue-900",
    label: "Severidade Média",
  },
  low: {
    bg: "bg-slate-200",
    text: "text-slate-800",
    label: "Severidade Baixa",
  },
};

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return value.slice(0, 2).toUpperCase();
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const getTimeEstimate = (score: number) => {
  if (score >= 60) return "Tempo estimado: contato prioritário (15-30 min).";
  if (score >= 40) return "Tempo estimado: contato breve (10-15 min).";
  return "Tempo estimado: acompanhamento leve (5-10 min).";
};

const MatchCardComponent = ({
  student,
  studentName,
  family,
  suggestion,
  insight,
  distanceKm,
  canHelp,
  onHelp,
  onSkip,
  onSeeMore,
}: MatchCardProps) => {
  const severityStyle = severityStyles[suggestion.severity];

  const serviceChips = useMemo(
    () => [
      {
        label: "SUS",
        active: family?.external_services?.sus?.registered ?? false,
      },
      {
        label: "CadÚnico",
        active: family?.external_services?.cad_unico?.registered ?? false,
      },
      {
        label: "BF",
        active: family?.external_services?.bolsa_familia?.beneficiary ?? false,
      },
    ],
    [family],
  );

  const accessibilityTag = student.disabilities?.wheelchair_user
    ? "Necessita apoio de mobilidade"
    : undefined;

  return (
    <article className="w-full max-w-sm rounded-3xl border border-slate-300 bg-slate-100 p-5 text-slate-900 shadow-xl shadow-slate-900/15">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20 text-sm font-bold text-primary-700 shadow-inner">
          {getInitials(studentName)}
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-semibold">{studentName}</h2>
          <p className="text-xs text-slate-600">
            {student.school.school_name} • {student.zone} •{" "}
            {distanceKm != null
              ? `${distanceKm.toFixed(1)} km de você`
              : "distância em avaliação"}
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide",
            severityStyle.bg,
            severityStyle.text,
          )}
        >
          {severityStyle.label}
        </span>
      </header>

      <section className="mt-3 space-y-2 text-left">
        <p className="text-sm text-slate-800">
          <span className="font-medium">💡 Insight:</span>{" "}
          {insight?.text ?? "Gerando insight respeitoso..."}
        </p>
        {insight?.source && (
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Fonte: {insight.source}
          </p>
        )}
      </section>

      <section className="mt-3 flex flex-wrap gap-2 text-left">
        {suggestion.tags.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary-500/15 px-2 py-1 text-[11px] font-medium text-primary-700"
          >
            #{tag}
          </span>
        ))}
        {accessibilityTag && (
          <span className="rounded-full bg-amber-200/80 px-2 py-1 text-[11px] font-medium text-amber-900">
            ♿ {accessibilityTag}
          </span>
        )}
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2 text-left text-xs">
        {serviceChips.map((chip) => (
          <span
            key={chip.label}
            className={clsx(
              "flex items-center justify-center rounded-lg px-2 py-2 font-medium",
              chip.active
                ? "bg-emerald-200/70 text-emerald-900"
                : "bg-slate-200 text-slate-700",
            )}
          >
            {chip.label} {chip.active ? "✔" : "—"}
          </span>
        ))}
        <span className="col-span-3 rounded-lg bg-slate-200 px-3 py-2 text-slate-700">
          {suggestion.reason}
        </span>
      </section>

      <section className="mt-3 space-y-1 text-left text-sm text-slate-700">
        <p>
          <span className="font-medium">Score:</span> {suggestion.score}
        </p>
        <p>{getTimeEstimate(suggestion.score)}</p>
      </section>

      <footer className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <button
          type="button"
          onClick={onSkip}
          className="col-span-1 rounded-xl border border-amber-400/70 py-1.5 px-2 font-semibold text-amber-800 transition hover:border-amber-500 hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          ❌ Pular
        </button>
        <button
          type="button"
          onClick={onHelp}
          disabled={!canHelp}
          className="col-span-2 rounded-xl bg-primary-500 py-2 px-3 font-semibold text-white shadow-md transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          💚 Ajudar
        </button>
      </footer>

      <button
        type="button"
        onClick={onSeeMore}
        className="mt-3 w-full text-sm font-semibold text-primary-600 underline transition hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        ℹ️ Ver mais
      </button>

      <p className="mt-3 text-center text-[11px] uppercase tracking-wide text-slate-500">
        POC — dados sintéticos
      </p>
    </article>
  );
};

const MatchCard = memo(MatchCardComponent);

export default MatchCard;
