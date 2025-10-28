import React from "react";
import { Layers, PackageCheck, PackageOpen, Warehouse } from "lucide-react";
import { Resource } from "../../services/api";

interface ResourcesMetricsProps {
  items: Resource[];
}

const cards = [
  { label: "Total", icon: Layers, color: "#4f46e5", getValue: (items: Resource[]) => items.length },
  { label: "Disponibles", icon: PackageCheck, color: "#16a34a", getValue: (items: Resource[]) => items.filter((it) => it.available).length },
  { label: "No disponibles", icon: PackageOpen, color: "#f97316", getValue: (items: Resource[]) => items.filter((it) => !it.available).length },
  { label: "Ubicaciones", icon: Warehouse, color: "#0ea5e9", getValue: (items: Resource[]) => new Set(items.map((it) => it.location || "Sin ubicación")).size },
] as const;

export default function ResourcesMetrics({ items }: ResourcesMetricsProps) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, min(100%, 1fr)))", gap: 16, marginBottom: 24 }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(items);

        return (
          <div
            key={card.label}
            style={{
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flex: "1 1 200px",
              minWidth: 0
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{card.label}</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{value}</span>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: `${card.color}1a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${card.color}33`
              }}
            >
              <Icon size={20} color={card.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
