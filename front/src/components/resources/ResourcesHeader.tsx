import React from "react";
import Button from "../ui/Button";
import { SlidersHorizontal, PlusCircle, ChevronRight } from "lucide-react";

interface ResourcesHeaderProps {
  onToggleFilters: () => void;
  onOpenCreate: () => void;
}

export default function ResourcesHeader({ onToggleFilters, onOpenCreate }: ResourcesHeaderProps) {
  return (
    <div
      style={{
        margin: "0 calc(-1 * clamp(16px, 4vw, 40px)) 32px",
        padding: "20px clamp(16px, 4vw, 40px)",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 280px", minWidth: 0 }}>
        <div style={{ color: "#9ca3af", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Recursos</span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            maxWidth: "100%",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: 1.25
          }}
        >
          Inventario de recursos
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13, overflowWrap: "anywhere" }}>
          Administra equipos, insumos y personal disponible en la operación.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          flex: "1 1 220px",
          minWidth: 0,
          justifyContent: "flex-end"
        }}
      >
        <Button
          variant="secondary"
          onClick={onToggleFilters}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            padding: 0,
            borderColor: "#e5e7eb",
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <SlidersHorizontal size={18} />
        </Button>
        <Button variant="primary" onClick={onOpenCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <PlusCircle size={16} /> Agregar recurso
        </Button>
      </div>
    </div>
  );
}
