import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";
import queryClient from "./lib/queryClient";
import "./styles/tailwind.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  </React.StrictMode>,
);
