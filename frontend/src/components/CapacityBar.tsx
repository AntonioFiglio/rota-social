type CapacityBarProps = {
  used: number;
  total: number;
  onNavigate?: () => void;
};

const CapacityBar = ({ used, total, onNavigate }: CapacityBarProps) => {
  const ratio = Math.min(used / total, 1);
  const percent = Math.round(ratio * 100);
  const statusColor =
    ratio >= 1 ? "bg-warning-500" : ratio >= 0.8 ? "bg-warning-500" : "bg-success-500";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-600">Capacidade</h3>
          <p className="text-lg font-semibold text-neutral-900">
            {used}/{total} chamados ativos
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Ir para Meus Chamados
        </button>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-neutral-200">
        <div
          className={`h-2 rounded-full ${statusColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Mantenha até dez casos ativos para garantir atenção individualizada.
      </p>
    </div>
  );
};

export default CapacityBar;
