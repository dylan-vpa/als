import React from "react";

interface DashboardHeaderSectionProps {
  greetingName?: string;
}

export default function DashboardHeaderSection({ greetingName }: DashboardHeaderSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>Panel general</h1>
      <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
        Bienvenido{greetingName ? `, ${greetingName}` : ""}. Revisa el estado de tus OITs y actividades recientes.
      </p>
    </div>
  );
}
