import React from "react";
import Card from "../ui/Card";
import { User, Shield, Hash } from "lucide-react";

interface ProfileOverviewGridProps {
  user: {
    id: number | string;
    full_name?: string | null;
    email: string;
    [key: string]: any;
  };
}

export default function ProfileOverviewGrid({ user }: ProfileOverviewGridProps) {
  const role = (user as any).role || "Operador";
  const tokenSnippet = typeof window !== "undefined" ? localStorage.getItem("auth_token")?.substring(0, 16) : undefined;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <User size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Información personal</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Nombre</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.full_name || "—"}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Email</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.email}</p>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={20} color="#22d3ee" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rol y permisos</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Rol actual</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{role}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Estado</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>Activo</p>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Hash size={20} color="#4ade80" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Identificadores</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>ID usuario</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{user.id}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Token</span>
              <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>{tokenSnippet ? `${tokenSnippet}...` : "—"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
