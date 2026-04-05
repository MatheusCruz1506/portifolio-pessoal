import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Home } from "./pages/Home/index.jsx";
import { ProjectsPage } from "./pages/ProjectsPage/index.jsx";
import { Contact } from "./pages/Contact/index.jsx";
import { Obrigado } from "./pages/Obrigado/index.jsx";

import { BrowserRouter, Route, Routes } from "react-router";

import "./index.css";

import ScrollToTop from "./components/ScrollToTop/index.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop routes={["/contact"]} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/all-projects" element={<ProjectsPage />} />
        <Route path="/thanks" element={<Obrigado />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
