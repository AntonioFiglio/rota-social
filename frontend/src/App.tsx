import { Suspense } from "react";

import AppRoutes from "./routes";
import Layout from "./components/Layout";

const App = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-900">
          <span className="animate-pulse text-lg font-semibold">
            Carregando Portal do Voluntário...
          </span>
        </div>
      }
    >
      <AppRoutes layout={<Layout />} />
    </Suspense>
  );
};

export default App;
