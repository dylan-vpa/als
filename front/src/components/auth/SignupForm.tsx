import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Input from "../ui/Input";
import Button from "../ui/Button";

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Nombre completo" placeholder="Nombre y apellido" value={fullName} onChange={(e) => setFullName(e.target.value)} />

      <Input label="Correo electrónico" type="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <Input label="Contraseña" type="password" placeholder="Define una contraseña segura" value={password} onChange={(e) => setPassword(e.target.value)} required />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}