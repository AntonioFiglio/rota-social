import { PropsWithChildren } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";

import { useVolunteerStore } from "../store/useVolunteer";

const navItems = [
  { to: "/dashboard", label: "Match do Cuidado" },
  { to: "/cases", label: "Meus Chamados" },
  { to: "/map", label: "Mapa" },
  { to: "/search", label: "Buscar" },
];

const Layout = ({ children }: PropsWithChildren) => {
  const volunteer = useVolunteerStore((state) => state.volunteer);
  const clearVolunteer = useVolunteerStore((state) => state.clear);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-primary-500">
              Portal do Voluntário
            </h1>
            {volunteer ? (
              <p className="text-sm text-neutral-600">
                Bem-vindo(a),{" "}
                <span className="font-medium text-neutral-900">
                  {volunteer.name}
                </span>{" "}
                — Zona{" "}
                <span className="font-medium text-neutral-900">
                  {volunteer.zone}
                </span>{" "}
                • Raio {volunteer.radius_km.toFixed(1)} km • Capacidade{" "}
                {volunteer.max_students}
              </p>
            ) : (
              <p className="text-sm text-neutral-600">
                Conclua o onboarding para iniciar as atividades.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 rounded-full bg-neutral-50 p-1 text-sm font-medium text-neutral-600 shadow-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                      isActive
                        ? "bg-primary-500 text-white"
                        : "hover:bg-neutral-200",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={clearVolunteer}
              className="rounded-full px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Trocar voluntário
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-1 flex-col px-6 pb-24 pt-8">
        {children ?? <Outlet />}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-3 text-xs text-neutral-600 md:flex-row md:items-center md:justify-between">
          <span>
            POC com dados sintéticos; nenhuma decisão automatizada; encaminhamentos
            sempre validados por humanos.
          </span>
          <span className="text-neutral-500">
            Última rota: <code>{location.pathname}</code>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
