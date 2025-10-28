import React from "react";
import Button from "../ui/Button";

interface ResourcesFilterPanelProps {
  typeLabels: Record<string, string>;
  availabilityLabels: Record<string, string>;
  pendingType: string;
  pendingAvailability: string;
  onChangeType: (value: string) => void;
  onChangeAvailability: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
}

export default function ResourcesFilterPanel({
  typeLabels,
  availabilityLabels,
  pendingType,
  pendingAvailability,
  onChangeType,
  onChangeAvailability,
  onCancel,
  onApply
}: ResourcesFilterPanelProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: 18,
        padding: 20,
        marginBottom: 24,
        boxShadow: "0 12px 35px rgba(15, 23, 42, 0.08)",
        display: "flex",
        flexWrap: "wrap",
        gap: 20
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 220px", minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Tipo</span>
        <select className="input" value={pendingType} onChange={(e) => onChangeType(e.target.value)} style={{ width: "100%", minWidth: 0 }}>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 220px", minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Disponibilidad</span>
        <select
          className="input"
          value={pendingAvailability}
          onChange={(e) => onChangeAvailability(e.target.value)}
          style={{ width: "100%", minWidth: 0 }}
        >
          {Object.entries(availabilityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onApply}>
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
