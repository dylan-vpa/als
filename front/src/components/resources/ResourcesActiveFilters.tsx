import React from "react";

interface ResourcesActiveFiltersProps {
  filterType: string;
  filterAvailable: string;
  typeLabels: Record<string, string>;
  availabilityLabels: Record<string, string>;
  onClearType: () => void;
  onClearAvailability: () => void;
}

export default function ResourcesActiveFilters({
  filterType,
  filterAvailable,
  typeLabels,
  availabilityLabels,
  onClearType,
  onClearAvailability
}: ResourcesActiveFiltersProps) {
  if (filterType === "todos" && filterAvailable === "todos") {
    return null;
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {filterType !== "todos" && (
        <button
          type="button"
          onClick={onClearType}
          style={{
            border: "none",
            background: "#dbeafe",
            color: "#1d4ed8",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Tipo: {typeLabels[filterType]} ✕
        </button>
      )}
      {filterAvailable !== "todos" && (
        <button
          type="button"
          onClick={onClearAvailability}
          style={{
            border: "none",
            background: "#dbeafe",
            color: "#1d4ed8",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Disponibilidad: {availabilityLabels[filterAvailable]} ✕
        </button>
      )}
    </div>
  );
}
