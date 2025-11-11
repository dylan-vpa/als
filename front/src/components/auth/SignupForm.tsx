import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupForm({ onSwitch }: { onSwitch?: () => void }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Asegurarse de que todos los campos requeridos estén completos
      if (!email || !password) {
        throw new Error("Por favor completa todos los campos requeridos");
      }
      
      // Llamar a la función signup con los datos del formulario
      const { token, user } = await signup({ 
        email, 
        password, 
        full_name: fullName || undefined 
      });
      
      // Opcional: Redirigir o cambiar a la vista de inicio de sesión
      onSwitch?.();
    } catch (err: any) {
      console.error("Error en el registro:", err);
      setError(err?.message || "Error al registrarse. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit"
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px"
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Nombre completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre y apellido"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      <div>
        <label style={labelStyle}>Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@empresa.com"
          required
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      <div>
        <label style={labelStyle}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Define una contraseña segura"
          required
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          color: "#991b1b",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "15px",
          fontWeight: "600",
          color: "white",
          background: loading ? "#93c5fd" : "#2563eb",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          marginTop: "8px"
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#1d4ed8")}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#2563eb")}
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}