import React from "react";
import Button from "../ui/Button";
import { SlidersHorizontal, PlusCircle, ChevronRight } from "lucide-react";

interface ResourcesHeaderProps {
  onToggleFilters: () => void;
  onOpenCreate: () => void;
}

export default function ResourcesHeader({ onToggleFilters, onOpenCreate }: ResourcesHeaderProps) {
  return (
    <div className="bg-card border-b px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-5 mb-6">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Recursos</span>
        </div>
        <h1 className="m-0 text-2xl font-bold text-foreground truncate">Inventario de recursos</h1>
        <p className="m-0 text-sm text-muted-foreground">Administra equipos, insumos y personal disponible en la operación.</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Button variant="secondary" onClick={onToggleFilters} className="h-11 w-11 rounded-xl border bg-muted/40">
          <SlidersHorizontal size={18} />
        </Button>
        <Button variant="primary" onClick={onOpenCreate} className="inline-flex items-center gap-2">
          <PlusCircle size={16} /> Agregar recurso
        </Button>
      </div>
    </div>
  );
}
