import React from "react";
import Card from "../ui/Card";
import { CheckCircle } from "lucide-react";

export default function ProfileSecuritySection() {
  const items = [
    {
      title: "Autenticación",
      description: "Contraseña verificada recientemente."
    },
    {
      title: "2FA",
      description: "Pendiente de activar."
    },
    {
      title: "Último acceso",
      description: "Hace unas horas."
    }
  ];

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle size={20} color="#22c55e" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Seguridad de la cuenta</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {items.map((item) => (
            <div key={item.title} style={{ padding: 14, borderRadius: 12, background: "#f1f5f9" }}>
              <strong style={{ display: "block", fontSize: 13 }}>{item.title}</strong>
              <span style={{ display: "block", marginTop: 4, color: "#64748b", fontSize: 13 }}>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
