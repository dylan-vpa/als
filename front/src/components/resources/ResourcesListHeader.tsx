import React from "react";
import Button from "../ui/Button";

interface ResourcesListHeaderProps {
  filteredCount: number;
  onExport: () => void;
}

export default function ResourcesListHeader({ filteredCount, onExport }: ResourcesListHeaderProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827", overflowWrap: "anywhere" }}>Listado de recursos</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280", overflowWrap: "anywhere" }}>{filteredCount} recursos encontrados</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 220px" }}>
        <Button variant="secondary" onClick={onExport}>
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
