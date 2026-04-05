import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import "./i18n.ts";
import App from "./App.tsx";

import { supabase } from "./services/supabaseClient";



if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
