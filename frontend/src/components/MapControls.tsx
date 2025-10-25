type MapControlsProps = {
  showSuggested: boolean;
  showAssigned: boolean;
  showRadius: boolean;
  showLines: boolean;
  onToggleSuggested: () => void;
  onToggleAssigned: () => void;
  onToggleRadius: () => void;
  onToggleLines: () => void;
};

const MapControls = ({
  showSuggested,
  showAssigned,
  showRadius,
  showLines,
  onToggleSuggested,
  onToggleAssigned,
  onToggleRadius,
  onToggleLines,
}: MapControlsProps) => {
  const ControlButton = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        active ? "bg-primary-500 text-white" : "bg-white text-neutral-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 shadow">
      <ControlButton
        label="Sugeridos"
        active={showSuggested}
        onClick={onToggleSuggested}
      />
      <ControlButton
        label="Atribuídos"
        active={showAssigned}
        onClick={onToggleAssigned}
      />
      <ControlButton
        label="Raio"
        active={showRadius}
        onClick={onToggleRadius}
      />
      <ControlButton
        label="Linhas"
        active={showLines}
        onClick={onToggleLines}
      />
    </div>
  );
};

export default MapControls;
