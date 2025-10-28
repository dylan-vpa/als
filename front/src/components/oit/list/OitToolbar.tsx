import React from "react";
import Button from "../../ui/Button";
import { SlidersHorizontal, FilePlus } from "lucide-react";

interface OitToolbarProps {
  onToggleFilters: () => void;
  onOpenUpload: () => void;
}

export default function OitToolbar({ onToggleFilters, onOpenUpload }: OitToolbarProps) {
  return (
    <div className="oit-toolbar">
      <div className="oit-toolbar__copy">
        <h1>Panel de OITs</h1>
        <p>Visualiza el progreso de las órdenes internas de trabajo y toma decisiones informadas.</p>
      </div>
      <div className="oit-toolbar__actions">
        <Button
          variant="secondary"
          className="oit-toolbar__filter-btn"
          onClick={onToggleFilters}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={18} />
        </Button>
        <Button
          variant="primary"
          className="oit-toolbar__upload-btn"
          onClick={onOpenUpload}
        >
          <FilePlus size={16} /> Subir OIT
        </Button>
      </div>
    </div>
  );
}
