import type { StudentProfile } from "../types/models";
import { useStudentName } from "../store/useStudentDirectory";

type StudentRowProps = {
  student: StudentProfile;
  distanceKm?: number;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  disabled?: boolean;
};

const StudentRow = ({
  student,
  distanceKm,
  onSelect,
  onAccept,
  disabled,
}: StudentRowProps) => {
  const studentName = useStudentName(student.id);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-primary-500 hover:shadow-md">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">
          {studentName}
        </h3>
        <p className="text-xs text-neutral-600">
          Escola {student.school.school_name} — turma {student.school.classroom} •{" "}
          Turno {student.school.shift}
        </p>
        {typeof distanceKm === "number" && (
          <p className="mt-1 text-xs text-neutral-500">
            Distância aproximada: {distanceKm.toFixed(1)} km
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-neutral-600">
          {student.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <button
          type="button"
          onClick={() => onSelect(student.id)}
          className="rounded-full border border-neutral-300 px-3 py-1 text-neutral-700 transition hover:border-primary-500 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Ver detalhes
        </button>
        <button
          type="button"
          onClick={() => onAccept(student.id)}
          disabled={disabled}
          className="rounded-full bg-primary-500 px-3 py-1 font-semibold text-white transition hover:bg-primary-500/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          Aceitar chamado
        </button>
      </div>
    </div>
  );
};

export default StudentRow;
