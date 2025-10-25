import type { SuggestionItem } from "../domain/suggestions";

import SuggestionCard from "./SuggestionCard";

type SuggestionsPanelProps = {
  suggestions: SuggestionItem[];
  onAccept: (studentId: string) => void;
  onDetails: (studentId: string) => void;
  onInsight: (studentId: string) => void;
  disabled?: boolean;
};

const SuggestionsPanel = ({
  suggestions,
  onAccept,
  onDetails,
  onInsight,
  disabled,
}: SuggestionsPanelProps) => {
  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Top 10 Sugestões
          </h2>
          <p className="text-sm text-neutral-600">
            Lista priorizada conforme demandas socioeducacionais e mobilidade.
          </p>
        </div>
      </header>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
          Nenhuma sugestão pendente no momento. Revise seus chamados ativos ou
          atualize os dados da zona.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={onAccept}
              onDetails={onDetails}
              onInsight={onInsight}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SuggestionsPanel;
