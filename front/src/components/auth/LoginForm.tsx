import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />

      <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}