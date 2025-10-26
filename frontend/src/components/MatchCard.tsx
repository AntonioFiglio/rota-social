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
    bg: "bg-warning-500/20",
    text: "text-warning-700",
    label: "Severidade Alta",
  },
  medium: {
    bg: "bg-primary-500/10",
    text: "text-primary-600",
    label: "Severidade Média",
  },
  low: {
    bg: "bg-neutral-200",
    text: "text-neutral-800",
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
    <article className="w-full max-w-sm rounded-2xl bg-white p-4 text-neutral-900 shadow-xl">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-500">
          {getInitials(studentName)}
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-semibold text-neutral-900">
            {studentName}
          </h2>
          <p className="text-xs text-neutral-600">
            {student.school.school_name} • {student.zone} •{" "}
            {distanceKm != null
              ? `${distanceKm.toFixed(1)} km de você`
              : "distância em avaliação"}
          </p>
        </div>
        <span
          className={clsx(
            "text-xs font-semibold px-2 py-1 rounded-full",
            severityStyle.bg,
            severityStyle.text,
          )}
        >
          {severityStyle.label}
        </span>
      </header>

      <section className="mt-3 space-y-2 text-left">
        <p className="text-sm text-neutral-800">
          <span className="font-medium">💡 Insight:</span>{" "}
          {insight?.text ?? "Gerando insight respeitoso..."}
        </p>
        {insight?.source && (
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Fonte: {insight.source}
          </p>
        )}
      </section>

      <section className="mt-3 flex flex-wrap gap-2 text-left">
        {suggestion.tags.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] font-medium text-primary-600"
          >
            #{tag}
          </span>
        ))}
        {accessibilityTag && (
          <span className="rounded-full bg-warning-500/20 px-2 py-1 text-[11px] font-medium text-warning-700">
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
                ? "bg-success-500/15 text-success-700"
                : "bg-neutral-200 text-neutral-700",
            )}
          >
            {chip.label} {chip.active ? "✔" : "—"}
          </span>
        ))}
        <span className="col-span-3 rounded-lg bg-neutral-100 px-3 py-2 text-neutral-700">
          {suggestion.reason}
        </span>
      </section>

      <section className="mt-3 space-y-1 text-left text-sm text-neutral-700">
        <p>
          <span className="font-medium">Score:</span> {suggestion.score}
        </p>
        <p>{getTimeEstimate(suggestion.score)}</p>
      </section>

      <footer className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <button
          type="button"
          onClick={onSkip}
          className="col-span-1 rounded-xl border border-warning-500/60 py-2 font-semibold text-warning-700 transition hover:border-warning-500 hover:text-warning-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning-500 focus-visible:ring-offset-2"
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
      </footer>

      <button
        type="button"
        onClick={onSeeMore}
        className="mt-2 w-full text-sm font-semibold text-primary-500 underline transition hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        ℹ️ Ver mais
      </button>

      <p className="mt-3 text-center text-[11px] uppercase tracking-wide text-neutral-400">
        POC — dados sintéticos
      </p>
    </article>
  );
};

const MatchCard = memo(MatchCardComponent);

export default MatchCard;
