const entries = [
  { color: "#2B6CB0", label: "Voluntário" },
  { color: "#ECC94B", label: "Sugeridos" },
  { color: "#48BB78", label: "Atribuídos" },
];

const MapLegend = () => (
  <div className="rounded-lg border border-neutral-200 bg-white/90 px-3 py-2 text-xs shadow">
    <p className="mb-2 font-semibold text-neutral-700">Legenda</p>
    <ul className="space-y-1">
      {entries.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-neutral-600">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  </div>
);

export default MapLegend;
