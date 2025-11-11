import React from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

interface AuthFormPanelProps {
  mode: "login" | "signup";
  onChangeMode: (mode: "login" | "signup") => void;
}

export default function AuthFormPanel({ mode, onChangeMode }: AuthFormPanelProps) {
  return (
    <div
      className="auth-form-container"
      style={{
        flex: "0 0 45%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        background: "#ffffff"
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <img src="/logo.png" alt="ALS Logo" style={{ height: "40px", width: "auto" }} />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "8px",
            lineHeight: "1.2"
          }}
        >
          {mode === "login" ? "¡Bienvenido de nuevo!" : "Crea tu cuenta"}
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>
          {mode === "login"
            ? "Ingresa con tus credenciales para continuar"
            : "Regístrate para comenzar a usar el panel de OIT"}
        </p>
      </div>

      <div>{mode === "login" ? <LoginForm /> : <SignupForm onSwitch={() => onChangeMode("login")} />}</div>

      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280"
        }}
      >
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => onChangeMode("signup")}
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
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => onChangeMode("login")}
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
              Inicia sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
