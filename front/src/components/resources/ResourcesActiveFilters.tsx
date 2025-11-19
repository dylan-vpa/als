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
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {filterType !== "todos" && (
        <button type="button" onClick={onClearType} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
          Tipo: {typeLabels[filterType]} ✕
        </button>
      )}
      {filterAvailable !== "todos" && (
        <button type="button" onClick={onClearAvailability} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
          Disponibilidad: {availabilityLabels[filterAvailable]} ✕
        </button>
      )}
    </div>
  );
}
