import { lazy, Suspense, useEffect } from "react";
import useThemeStore from "./store/useThemeStore";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PermissionRoute from "./routes/PermissionRoute";
import useSupabaseStore from "./store/useSupabaseStore";
import MainLayout from "./components/layout/MainLayout";
import GlobalFeedback from "./components/ui/GlobalFeedback";

const Login = lazy(() => import("./pages/login/Login"));
const Register = lazy(() => import("./pages/register/Register"));
const DashBoard = lazy(() => import("./pages/dashboard/Dashboard"));
const UnitsMap = lazy(() =>
  import("./pages/units-map/UnitsMap").then((module) => ({
    default: module.UnitsMap,
  })),
);
const ImoveisList = lazy(() => import("./pages/imoveis-list/ImoveisList"));
const ImoveisForm = lazy(() => import("./pages/imovel-form/ImovelForm"));
const ConfigPage = lazy(() => import("./pages/config/Config"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="w-10 h-10 border-4 border-border-subtle border-t-primary-light rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { initializeAuth, user, isAuthLoading } = useSupabaseStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    return initializeAuth();
  }, [initializeAuth]);

  // Aplica o tema na tag HTML
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [theme]);

  // Aguarda a verificação de sessão antes de renderizar as rotas
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="w-10 h-10 border-4 border-border-subtle border-t-primary-light rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GlobalFeedback />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <Register />}
          />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashBoard />} />
            <Route path="/map" element={<UnitsMap />} />
            <Route path="/imoveis" element={<ImoveisList />} />
            <Route
              path="/imoveis/novo"
              element={
                <PermissionRoute>
                  <ImoveisForm />
                </PermissionRoute>
              }
            />
            <Route path="/config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
