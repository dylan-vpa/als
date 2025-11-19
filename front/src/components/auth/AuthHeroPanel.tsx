import React from "react";

interface AuthHeroPanelProps {
  title: string;
  description: string;
  slides: { title: string; description: string }[];
  currentSlide: number;
  onSelectSlide: (index: number) => void;
}

export default function AuthHeroPanel({ title, description, slides, currentSlide, onSelectSlide }: AuthHeroPanelProps) {
  return (
    <div
      style={{
        height: "100%",
        backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        position: "relative",
        overflow: "hidden",
      }}
      className="auth-hero"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)",
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: "500px", color: "white", zIndex: 1 }}>
        <h2
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "20px",
            lineHeight: "1.2",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            transition: "opacity 0.5s ease-in-out"
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: "18px",
            lineHeight: "1.6",
            opacity: 0.95,
            marginBottom: "32px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            transition: "opacity 0.5s ease-in-out"
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelectSlide(index)}
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
  );
}
