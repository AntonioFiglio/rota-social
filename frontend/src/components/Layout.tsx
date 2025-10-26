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

  if (location.pathname.startsWith("/dashboard")) {
    return <>{children ?? <Outlet />}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          {/* Left section - Brand and volunteer info */}
          <div className="space-y-3">
            {/* Clean brand title */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                <span className="text-sm font-medium text-white">P</span>
              </div>
              <h1 className="text-xl font-semibold text-neutral-900">
                Portal do Voluntário
              </h1>
            </div>
            
            {/* Clean volunteer info */}
            {volunteer ? (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Bem-vindo(a)
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-neutral-900">
                    {volunteer.name}
                  </span>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-600">
                    Zona {volunteer.zone}
                  </span>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-600">
                    {volunteer.radius_km.toFixed(1)} km
                  </span>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-600">
                    Cap. {volunteer.max_students}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">
                Conclua o onboarding para iniciar as atividades.
              </p>
            )}
          </div>
          
          {/* Right section - Navigation and actions */}
          <div className="flex items-center gap-4">
            {/* Clean navigation */}
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 no-underline",
                      isActive
                        ? "text-primary-600"
                        : "text-neutral-600 hover:text-primary-600",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            {/* Clean action button */}
            <button
              type="button"
              onClick={clearVolunteer}
              className="px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
