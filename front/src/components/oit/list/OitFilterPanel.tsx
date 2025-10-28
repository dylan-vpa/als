import React from "react";
import Button from "../../ui/Button";

interface OitFilterPanelProps {
  typeDropdownRef: React.RefObject<HTMLDivElement | null>;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  pendingFilterType: string;
  pendingFilterStatus: string;
  typeDropdownOpen: boolean;
  statusDropdownOpen: boolean;
  onToggleTypeDropdown: () => void;
  onToggleStatusDropdown: () => void;
  onSelectPendingType: (value: string) => void;
  onSelectPendingStatus: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
}

export default function OitFilterPanel({
  typeDropdownRef,
  statusDropdownRef,
  typeLabels,
  statusLabels,
  pendingFilterType,
  pendingFilterStatus,
  typeDropdownOpen,
  statusDropdownOpen,
  onToggleTypeDropdown,
  onToggleStatusDropdown,
  onSelectPendingType,
  onSelectPendingStatus,
  onCancel,
  onApply
}: OitFilterPanelProps) {
  return (
    <div className="oit-filter-panel">
      <div className="oit-filter-field" ref={typeDropdownRef}>
        <span>Tipo de documento</span>
        <button
          type="button"
          className="oit-filter-field__trigger"
          onClick={onToggleTypeDropdown}
        >
          {typeLabels[pendingFilterType] ?? "Seleccionar"}
          <span className="oit-filter-field__chevron">▾</span>
        </button>
        {typeDropdownOpen && (
          <div className="oit-filter-field__menu">
            {Object.entries(typeLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`oit-filter-field__option ${value === pendingFilterType ? "is-active" : ""}`.trim()}
                onClick={() => onSelectPendingType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="oit-filter-field" ref={statusDropdownRef}>
        <span>Estado</span>
        <button
          type="button"
          className="oit-filter-field__trigger"
          onClick={onToggleStatusDropdown}
        >
          {statusLabels[pendingFilterStatus] ?? "Seleccionar"}
          <span className="oit-filter-field__chevron">▾</span>
        </button>
        {statusDropdownOpen && (
          <div className="oit-filter-field__menu">
            {Object.entries(statusLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`oit-filter-field__option ${value === pendingFilterStatus ? "is-active" : ""}`.trim()}
                onClick={() => onSelectPendingStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="oit-filter-actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onApply}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}
