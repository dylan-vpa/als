import React from "react";
import { ChevronRight, Sparkles } from "lucide-react";

interface AiChatHeaderProps {
  selectedModel: string;
}

export default function AiChatHeader({ selectedModel }: AiChatHeaderProps) {
  return (
    <div
      style={{
        margin: "0 -40px",
        padding: "20px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 82,
        zIndex: 15
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Asistente</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>Asistente inteligente</h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
          Interactúa con el asistente para obtener insights sobre tus OITs y recursos.
        </p>
      </div>
      <div
        style={{
          background: "#eef2ff",
          border: "1px solid #c7d2fe",
          color: "#4338ca",
          borderRadius: 16,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}
      >
        <Sparkles size={18} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Modelo activo: {selectedModel}</span>
      </div>
    </div>
  );
}
