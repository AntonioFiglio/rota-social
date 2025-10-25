import dayjs from "dayjs";

import type { CaseItem, TimelineEvent } from "../store/useCases";

type CaseTimelineProps = {
  caseItem?: CaseItem;
  onClose: () => void;
};

const TimelineEventRow = ({ event }: { event: TimelineEvent }) => (
  <li className="relative pl-6">
    <span className="absolute left-2 top-1 h-2 w-2 rounded-full bg-primary-500" />
    <p className="text-xs uppercase tracking-wide text-neutral-500">
      {dayjs(event.timestamp).format("DD/MM/YYYY HH:mm")}
    </p>
    <p className="text-sm font-semibold text-neutral-800">{event.label}</p>
    {event.description && (
      <p className="text-sm text-neutral-600">{event.description}</p>
    )}
  </li>
);

const CaseTimeline = ({ caseItem, onClose }: CaseTimelineProps) => {
  if (!caseItem) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Timeline — {caseItem.studentId}
            </h3>
            <p className="text-sm text-neutral-600">
              Status atual:{" "}
              <span className="font-medium text-neutral-900">
                {caseItem.status}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {caseItem.timeline.length === 0 ? (
            <li className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-sm text-neutral-500">
              Ainda não registramos interações. Use as ações rápidas para
              documentar o cuidado prestado.
            </li>
          ) : (
            caseItem.timeline
              .slice()
              .reverse()
              .map((event) => <TimelineEventRow key={event.id} event={event} />)
          )}
        </ul>
      </div>
    </div>
  );
};

export default CaseTimeline;
