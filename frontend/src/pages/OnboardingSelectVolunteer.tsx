import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchVolunteers } from "../lib/api";
import { useVolunteerStore } from "../store/useVolunteer";
import type { VolunteerProfile } from "../types/models";

const ZONES = ["Sao Paulo", "Franca", "Goiania"];

const VolunteerCard = ({
  volunteer,
  onSelect,
}: {
  volunteer: VolunteerProfile;
  onSelect: (volunteer: VolunteerProfile) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(volunteer)}
    className="flex w-full flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-primary-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
  >
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-neutral-900">
        {volunteer.name}
      </h3>
      {volunteer.verified && (
        <span className="rounded-full bg-success-500/20 px-3 py-1 text-xs font-semibold text-success-700">
          Verificado
        </span>
      )}
    </div>
    <p className="text-sm text-neutral-600">
      Zona {volunteer.zone} • Raio {volunteer.radius_km.toFixed(1)} km • Capacidade
      {" "}
      {volunteer.max_students}
    </p>
    {volunteer.warm_notes && (
      <p className="text-sm text-neutral-500">{volunteer.warm_notes}</p>
    )}
    <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
      {volunteer.skills.slice(0, 3).map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-neutral-200 px-2 py-1 text-neutral-700"
        >
          {skill}
        </span>
      ))}
    </div>
  </button>
);

const OnboardingSelectVolunteer = () => {
  const [zone, setZone] = useState<string>(ZONES[0]);
  const setVolunteer = useVolunteerStore((state) => state.setVolunteer);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["volunteers", zone],
    queryFn: () => fetchVolunteers(zone),
  });

  const handleSelect = (volunteer: VolunteerProfile) => {
    setVolunteer(volunteer);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-primary-500">
          Bem-vindo(a) ao Portal do Voluntário
        </h1>
        <p className="text-sm text-neutral-600">
          Escolha seu perfil para carregar a agenda da sua zona e acessar as
          ferramentas de apoio.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Selecionar zona de atuação
          <select
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {ZONES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          {isFetching && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">
              Carregando voluntários disponíveis...
            </div>
          )}
          {data?.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              onSelect={handleSelect}
            />
          ))}
          {!isFetching && !data?.length && (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">
              Nenhum voluntário encontrado nesta zona. Solicite suporte à equipe
              responsável.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSelectVolunteer;
