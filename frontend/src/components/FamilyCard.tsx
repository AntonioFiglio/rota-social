import type { FamilyProfile } from "../types/models";

type FamilyCardProps = {
  family: FamilyProfile;
};

const FamilyCard = ({ family }: FamilyCardProps) => {
  const services = family.external_services;
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">
        Família {family.id}
      </h3>
      <p className="text-sm text-neutral-600">{family.warm_notes}</p>

      <div className="mt-4 grid gap-3 text-sm text-neutral-700 md:grid-cols-2">
        <div>
          <h4 className="font-semibold text-neutral-800">Composição</h4>
          <ul className="mt-1 space-y-1">
            {family.household.map((member) => (
              <li key={member.person_id} className="text-neutral-600">
                <span className="font-medium text-neutral-900">
                  {member.person_id}
                </span>{" "}
                — {member.role}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-neutral-800">Serviços Públicos</h4>
          <ul className="mt-1 space-y-1 text-neutral-600">
            <li>
              SUS:{" "}
              <span className="font-medium">
                {services.sus.registered ? "Ativo" : "Não localizado"}
              </span>{" "}
              {services.sus.unit && `— ${services.sus.unit}`}
            </li>
            <li>
              CadÚnico:{" "}
              <span className="font-medium">
                {services.cad_unico.registered ? "Registrado" : "Pendência"}
              </span>
              {services.cad_unico.nis && ` • NIS ${services.cad_unico.nis}`}
            </li>
            <li>
              Bolsa Família:{" "}
              <span className="font-medium">
                {services.bolsa_familia.beneficiary
                  ? "Benefício ativo"
                  : services.bolsa_familia.status ?? "Não beneficiária"}
              </span>
            </li>
            <li>
              Outros:{" "}
              {services.others.length === 0
                ? "nenhum registrado"
                : services.others
                    .filter((item) => item.active)
                    .map((item) => item.name)
                    .join(", ")}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-neutral-800">Sinais de elegibilidade</h4>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {family.eligibility_signals.map((signal) => (
            <span
              key={signal}
              className="rounded-full bg-warning-500/20 px-3 py-1 font-medium text-warning-700"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FamilyCard;
