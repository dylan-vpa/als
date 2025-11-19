import React from "react";
import { Resource, ResourceUpdate } from "../../services/api";
import { PencilLine, Trash2, Check, X } from "lucide-react";
import Button from "../ui/Button";

interface ResourcesCardListProps {
  items: Resource[];
  editingId: number | null;
  editForm: ResourceUpdate;
  typeLabels: Record<string, string>;
  onStartEdit: (item: Resource) => void;
  onEditChange: (field: keyof ResourceUpdate, value: ResourceUpdate[keyof ResourceUpdate]) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
}

export default function ResourcesCardList({
  items,
  editingId,
  editForm,
  typeLabels,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: ResourcesCardListProps) {
  return (
    <div className="grid gap-3">
      {items.map((it) => {
        const isEditing = editingId === it.id;
        return (
          <div key={it.id} className="bg-card border rounded-xl p-4 grid gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Recurso</span>
              {isEditing ? (
                <input
                  className="input"
                  type="text"
                  value={editForm.name ?? it.name}
                  onChange={(e) => onEditChange("name", e.target.value)}
                />
              ) : (
                <span className="font-semibold text-foreground break-words">{it.name}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</span>
              {isEditing ? (
                <select
                  className="input"
                  value={editForm.type ?? it.type}
                  onChange={(e) => onEditChange("type", e.target.value)}
                >
                  <option value="vehiculo">Vehículo</option>
                  <option value="equipo">Equipo</option>
                  <option value="personal">Personal</option>
                  <option value="insumo">Insumo</option>
                </select>
              ) : (
                <span className="text-muted-foreground">{typeLabels[it.type] || it.type}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Cantidad</span>
              {isEditing ? (
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={editForm.quantity ?? it.quantity}
                  onChange={(e) => onEditChange("quantity", Number(e.target.value))}
                />
              ) : (
                <span className="font-semibold text-foreground">{it.quantity}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Disponibilidad</span>
              {isEditing ? (
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editForm.available ?? it.available ?? false}
                    onChange={(e) => onEditChange("available", e.target.checked)}
                  />
                  Disponible
                </label>
              ) : it.available ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">Disponible</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-medium">Sin stock</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Ubicación</span>
              {isEditing ? (
                <input
                  className="input"
                  type="text"
                  value={editForm.location ?? it.location ?? ""}
                  onChange={(e) => onEditChange("location", e.target.value)}
                />
              ) : (
                <span className="text-muted-foreground break-words">{it.location || "—"}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Descripción</span>
              {isEditing ? (
                <textarea
                  className="input"
                  value={editForm.description ?? it.description ?? ""}
                  onChange={(e) => onEditChange("description", e.target.value)}
                  rows={3}
                />
              ) : (
                <span className="text-muted-foreground break-words">{it.description || "—"}</span>
              )}
            </div>

            <div className="flex gap-2 justify-start flex-wrap">
              {isEditing ? (
                <>
                  <Button size="icon" variant="secondary" onClick={() => onSaveEdit(it.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={onCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="outline" onClick={() => onStartEdit(it)}>
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => onDelete(it.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
