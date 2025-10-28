import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthFormPanel from "../components/auth/AuthFormPanel";
import AuthHeroPanel from "../components/auth/AuthHeroPanel";

const heroSlides = [
  {
    title: "Manage your operations with ease",
    description: "ALS Dashboard helps you streamline your workflow, manage resources, and track operations efficiently."
  },
  {
    title: "Powerful analytics at your fingertips",
    description: "Get real-time insights and make data-driven decisions with our comprehensive analytics tools."
  },
  {
    title: "Collaborate seamlessly with your team",
    description: "Work together efficiently with built-in collaboration features and real-time updates."
  }
];

export default function AuthPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (user) return <Navigate to="/" replace />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#ffffff"
      }}
    >
      <AuthFormPanel mode={mode} onChangeMode={setMode} />
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