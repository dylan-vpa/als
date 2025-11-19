import React from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import Button from "../ui/Button";

interface AuthFormPanelProps {
  mode: "login" | "signup";
  onChangeMode: (mode: "login" | "signup") => void;
}

export default function AuthFormPanel({ mode, onChangeMode }: AuthFormPanelProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="ALS Logo" className="h-10 w-auto" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "login" ? "¡Bienvenido de nuevo!" : "Crea tu cuenta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Ingresa con tus credenciales para continuar"
            : "Regístrate para comenzar a usar el panel de OIT"}
        </p>
      </div>

      <div>{mode === "login" ? <LoginForm /> : <SignupForm onSwitch={() => onChangeMode("login")} />}</div>

      <div className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Button variant="link" onClick={() => onChangeMode("signup")}>Regístrate</Button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Button variant="link" onClick={() => onChangeMode("login")}>Inicia sesión</Button>
          </>
        )}
      </div>
    </div>
  );
}
