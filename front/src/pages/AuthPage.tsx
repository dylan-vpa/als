import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";

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
    <div style={{ 
      display: "flex", 
      minHeight: "100vh",
      background: "#ffffff"
    }}>
      {/* Left Side - Form */}
      <div 
        className="auth-form-container"
        style={{ 
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "#ffffff"
        }}>
        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src="/logo.png" 
            alt="ALS Logo" 
            style={{ height: "40px", width: "auto" }}
          />
        </div>

        {/* Welcome Text */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: "700", 
            color: "#1a1a1a",
            marginBottom: "8px",
            lineHeight: "1.2"
          }}>
            {mode === "login" ? "Hi there!" : "Create Account"}
          </h1>
          <p style={{ 
            fontSize: "15px", 
            color: "#6b7280",
            margin: 0
          }}>
            {mode === "login" ? "Welcome to ALS Dashboard" : "Join ALS Dashboard today"}
          </p>
        </div>

        {/* Form */}
        <div>
          {mode === "login" ? (
            <LoginForm />
          ) : (
            <SignupForm onSwitch={() => setMode("login")} />
          )}
        </div>

        {/* Switch Mode */}
        <div style={{ 
          marginTop: "24px",
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280"
        }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px"
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px"
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div style={{ 
        flex: "1",
        backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "32px 0 0 32px"
      }}
      className="auth-hero"
      >
        {/* Overlay oscuro para mejorar legibilidad del texto */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)",
          zIndex: 0
        }} />
        
        <div style={{
          maxWidth: "500px",
          color: "white",
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "20px",
            lineHeight: "1.2",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            transition: "opacity 0.5s ease-in-out"
          }}>
            {heroSlides[currentSlide].title}
          </h2>
          <p style={{
            fontSize: "18px",
            lineHeight: "1.6",
            opacity: 0.95,
            marginBottom: "32px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            transition: "opacity 0.5s ease-in-out"
          }}>
            {heroSlides[currentSlide].description}
          </p>
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center"
          }}>
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: currentSlide === index ? "white" : "rgba(255,255,255,0.5)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease"
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}