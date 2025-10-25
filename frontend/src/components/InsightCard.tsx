import dayjs from "dayjs";

import type { InsightResponse } from "../types/models";

type InsightCardProps = {
  insight: InsightResponse;
};

const sourceLabels: Record<string, string> = {
  openai: "Modelo OpenAI",
  mock: "Insight mock",
  fallback: "Fallback seguro",
};

const InsightCard = ({ insight }: InsightCardProps) => {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-700">
            {sourceLabels[insight.source] ?? "Insight"}
          </h4>
          <p className="text-xs text-neutral-500">
            {insight.generated_at
              ? dayjs(insight.generated_at).format("DD/MM/YYYY HH:mm")
              : "Recém-gerado"}
          </p>
        </div>
        {insight.model && insight.model !== "none" ? (
          <span className="rounded-full bg-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700">
            {insight.model}
          </span>
        ) : null}
      </header>
      <p className="mt-3 text-sm text-neutral-800">{insight.insight}</p>
    </article>
  );
};

export default InsightCard;
