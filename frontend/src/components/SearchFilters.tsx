type SearchFiltersProps = {
  query: string;
  zone: string;
  radiusKm: number;
  maxRadiusKm: number;
  accessibleOnly: boolean;
  bestForMe: boolean;
  availableZones: string[];
  onQueryChange: (value: string) => void;
  onZoneChange: (zone: string) => void;
  onRadiusChange: (radius: number) => void;
  onAccessibleToggle: () => void;
  onBestForMeToggle: () => void;
};

const SearchFilters = ({
  query,
  zone,
  radiusKm,
  maxRadiusKm,
  accessibleOnly,
  bestForMe,
  availableZones,
  onQueryChange,
  onZoneChange,
  onRadiusChange,
  onAccessibleToggle,
  onBestForMeToggle,
}: SearchFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <label className="flex flex-1 flex-col text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Buscar aluno ou tag
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Ex.: transporte, S0001"
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          />
        </label>
        <label className="flex w-full flex-col text-xs font-semibold uppercase tracking-wide text-neutral-600 md:w-48">
          Zona
          <select
            value={zone}
            onChange={(event) => onZoneChange(event.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {availableZones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full flex-col text-xs font-semibold uppercase tracking-wide text-neutral-600 md:w-40">
          Raio (km)
          <input
            type="range"
            min={2}
            max={Math.max(maxRadiusKm, 2)}
            step={0.5}
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="mt-2"
          />
          <span className="mt-1 text-xs text-neutral-600">
            Até {radiusKm.toFixed(1)} km
          </span>
        </label>
      </div>
      <div className="flex flex-col gap-2 text-sm text-neutral-700 md:w-auto md:flex-row md:items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={accessibleOnly}
            onChange={onAccessibleToggle}
            className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          Acessibilidade prioritária
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bestForMe}
            onChange={onBestForMeToggle}
            className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          Melhores para mim
        </label>
      </div>
    </div>
  );
};

export default SearchFilters;
