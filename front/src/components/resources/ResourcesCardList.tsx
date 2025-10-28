import React from "react";
import { Resource, ResourceUpdate } from "../../services/api";
import { PencilLine, Trash2, Check, X } from "lucide-react";

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
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((it) => {
        const isEditing = editingId === it.id;
        return (
          <div
            key={it.id}
            style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e5e7eb", padding: 18, display: "grid", gap: 12 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Recurso</span>
              {isEditing ? (
                <input
                  className="input"
                  type="text"
                  value={editForm.name ?? it.name}
                  onChange={(e) => onEditChange("name", e.target.value)}
                />
              ) : (
                <span style={{ fontWeight: 600, color: "#0f172a", overflowWrap: "anywhere" }}>{it.name}</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Tipo</span>
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
                <span style={{ color: "#475569" }}>{typeLabels[it.type] || it.type}</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Cantidad</span>
              {isEditing ? (
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={editForm.quantity ?? it.quantity}
                  onChange={(e) => onEditChange("quantity", Number(e.target.value))}
                />
              ) : (
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{it.quantity}</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Disponibilidad</span>
              {isEditing ? (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                  <input
                    type="checkbox"
                    checked={editForm.available ?? it.available ?? false}
                    onChange={(e) => onEditChange("available", e.target.checked)}
                  />
                  Disponible
                </label>
              ) : it.available ? (
                <span className="badge badge-success">Disponible</span>
              ) : (
                <span className="badge badge-danger">Sin stock</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Ubicación</span>
              {isEditing ? (
                <input
                  className="input"
                  type="text"
                  value={editForm.location ?? it.location ?? ""}
                  onChange={(e) => onEditChange("location", e.target.value)}
                />
              ) : (
                <span style={{ color: "#475569", overflowWrap: "anywhere" }}>{it.location || "—"}</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>Descripción</span>
              {isEditing ? (
                <textarea
                  className="input"
                  value={editForm.description ?? it.description ?? ""}
                  onChange={(e) => onEditChange("description", e.target.value)}
                  rows={3}
                />
              ) : (
                <span style={{ color: "#475569", overflowWrap: "anywhere" }}>{it.description || "—"}</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", flexWrap: "wrap" }}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => onSaveEdit(it.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: "none",
                      background: "#22c55e",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(34,197,94,0.25)"
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ef4444",
                      cursor: "pointer"
                    }}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEdit(it)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1d4ed8",
                      cursor: "pointer"
                    }}
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(it.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#dc2626",
                      cursor: "pointer"
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
