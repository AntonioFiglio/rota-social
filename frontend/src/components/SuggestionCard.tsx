import clsx from "clsx";

import type { SuggestionItem } from "../domain/suggestions";
import { useStudentName } from "../store/useStudentDirectory";

type SuggestionCardProps = {
  suggestion: SuggestionItem;
  onAccept: (studentId: string) => void;
  onDetails: (studentId: string) => void;
  onInsight: (studentId: string) => void;
  disabled?: boolean;
};

const severityStyles: Record<string, string> = {
  high: "bg-warning-500/20 text-warning-700 border-warning-500/40",
  medium: "bg-primary-500/10 text-primary-600 border-primary-500/30",
  low: "bg-success-500/10 text-success-700 border-success-500/30",
};

const SuggestionCard = ({
  suggestion,
  onAccept,
  onDetails,
  onInsight,
  disabled,
}: SuggestionCardProps) => {
  const studentName = useStudentName(suggestion.studentId);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-neutral-900">
            {studentName}
          </h4>
          <p className="text-sm text-neutral-600">{suggestion.description}</p>
        </div>
        <span
          className={clsx(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            severityStyles[suggestion.severity],
          )}
        >
          prioridade {suggestion.severity}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <span className="rounded-full bg-neutral-200 px-2 py-1">
          Distância {suggestion.distanceKm.toFixed(1)} km
        </span>
        <span className="rounded-full bg-neutral-200 px-2 py-1">
          Score {suggestion.score}
        </span>
        {suggestion.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-neutral-200 px-2 py-1 text-neutral-700"
          >
            #{tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-neutral-700">{suggestion.reason}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAccept(suggestion.studentId)}
          disabled={disabled}
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            disabled
              ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
              : "bg-primary-500 text-white hover:bg-primary-500/90",
          )}
        >
          {suggestion.ctaLabel}
        </button>
        <button
          type="button"
          onClick={() => onInsight(suggestion.studentId)}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Gerar insight
        </button>
        <button
          type="button"
          onClick={() => onDetails(suggestion.studentId)}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Ver detalhes
        </button>
      </div>
    </article>
  );
};

export default SuggestionCard;
