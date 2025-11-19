import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthFormPanel from "../components/auth/AuthFormPanel";
import AuthHeroPanel from "../components/auth/AuthHeroPanel";

const heroSlides = [
  {
    title: "Gestiona tus operaciones con facilidad",
    description: "ALS Dashboard te ayuda a organizar el flujo de trabajo, asignar recursos y seguir tus operaciones en tiempo real."
  },
  {
    title: "Toma decisiones con datos confiables",
    description: "Obtén métricas al instante y guía tus decisiones con paneles e indicadores personalizados."
  },
  {
    title: "Colabora con todo tu equipo",
    description: "Trabaja en conjunto con actualizaciones automáticas, alertas inteligentes y seguimiento centralizado."
  }
];

export default function AuthPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState<"login" | "signup">(() => {
    try {
      const isRegisterPath = location.pathname.endsWith("/register");
      const params = new URLSearchParams(location.search);
      const qMode = params.get("mode");
      if (isRegisterPath || qMode === "signup") return "signup";
      return "login";
    } catch {
      return "login";
    }
  });

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (user && mode !== "signup") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-10">
        <AuthFormPanel mode={mode} onChangeMode={setMode} />
      </div>
      <div className="hidden md:block">
        <AuthHeroPanel
          title={heroSlides[currentSlide].title}
          description={heroSlides[currentSlide].description}
          slides={heroSlides}
          currentSlide={currentSlide}
          onSelectSlide={setCurrentSlide}
        />
      </div>
    </div>
  );
}