import React from "react";
import Button from "../ui/Button";
import { LogOut } from "lucide-react";

interface ProfileHeaderProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function ProfileHeader({ onLogout, isLoggingOut }: ProfileHeaderProps) {
  return (
    <div
      style={{
        margin: "0 -40px 32px",
        padding: "20px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
          <span>Dashboard</span>
          <span>›</span>
          <span>Perfil</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>Cuenta de usuario</h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
          Visualiza tu información personal y estado de seguridad.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="primary" onClick={onLogout} disabled={isLoggingOut}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
