import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
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
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#ffffff"
      }}
    >
      <AuthFormPanel mode="login" onChangeMode={() => {}} />
      <AuthHeroPanel
        title={heroSlides[currentSlide].title}
        description={heroSlides[currentSlide].description}
        slides={heroSlides}
        currentSlide={currentSlide}
        onSelectSlide={setCurrentSlide}
      />
    </div>
  );
}