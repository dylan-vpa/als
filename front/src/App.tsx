import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import AuthPage from "./pages/AuthPage";
import OitDetailPage from "./pages/OitDetailPage";
import OitSamplingPage from "./pages/OitSamplingPage";
import ResourcesPage from "./pages/ResourcesPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import OitListPage from "./pages/OitListPage";
import AiChatPage from "./pages/AiChatPage";
import ProfilePage from "./pages/ProfilePage";
import AlertsPage from "./pages/AlertsPage";

function Navbar() {
  const { user } = useAuth();
  return (
    <header className="navbar">
      <div className="container navbar-content">
        <div className="logo">Paradixe</div>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link className="btn btn-secondary" to="/">Inicio</Link>
          {user ? (
            <>
              <Link className="btn btn-primary" to="/dashboard">Dashboard</Link>
              {/* Cambiar Recursos a la nueva ruta bajo /dashboard */}
              <Link className="btn btn-secondary" to="/dashboard/resources">Recursos</Link>
            </>
          ) : (
            <Link className="btn btn-primary" to="/auth">Acceder</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Home() {
  return (
    <div className="home-layout">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="hero">
            <h1 className="hero-title">Construye tu asistente con estilo</h1>
            <p className="hero-subtitle">Frontend moderno con React + Vite y backend con FastAPI. Autenticación JWT lista.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link className="btn btn-primary" to="/auth">Comenzar</Link>
              <Link className="btn btn-secondary" to="/dashboard">Ver dashboard</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Routes>
          {/* Redirige inicio a dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          {/* Ruta directa para registro que abre AuthPage en modo signup */}
          <Route path="/register" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OitListPage />
              </ProtectedRoute>
            }
          />
          {/* Añadir ruta explícita para listado de OITs bajo /dashboard/oit */}
          <Route
            path="/dashboard/oit"
            element={
              <ProtectedRoute>
                <OitListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/oit/:id"
            element={
              <ProtectedRoute>
                <OitDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/oit/:id/muestreo"
            element={
              <ProtectedRoute>
                <OitSamplingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/resources"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chat"
            element={
              <ProtectedRoute>
                <AiChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationsProvider>
    </AuthProvider>
  );
}