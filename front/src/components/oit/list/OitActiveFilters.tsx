import React from "react";

interface OitActiveFiltersProps {
  filterType: string;
  filterStatus: string;
  statusLabels: Record<string, string>;
  onClearType: () => void;
  onClearStatus: () => void;
}

export default function OitActiveFilters({ filterType, filterStatus, statusLabels, onClearType, onClearStatus }: OitActiveFiltersProps) {
  if (filterType === "todos" && filterStatus === "todos") {
    return null;
  }

  return (
    <div className="oit-active-filters">
      {filterType !== "todos" && (
        <button
          type="button"
          className="oit-chip oit-chip--type"
          onClick={onClearType}
        >
          Tipo: {filterType} ✕
        </button>
      )}
      {filterStatus !== "todos" && (
        <button
          type="button"
          className="oit-chip oit-chip--status"
          onClick={onClearStatus}
        >
          Estado: {statusLabels[filterStatus] ?? filterStatus} ✕
        </button>
      )}
    </div>
  );
}
