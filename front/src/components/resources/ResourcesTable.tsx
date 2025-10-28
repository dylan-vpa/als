import React from "react";
import { Resource, ResourceUpdate } from "../../services/api";
import { PencilLine, Trash2, Check, X } from "lucide-react";

interface ResourcesTableProps {
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

export default function ResourcesTable({
  items,
  editingId,
  editForm,
  typeLabels,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: ResourcesTableProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            {[
              "Recurso",
              "Tipo",
              "Cantidad",
              "Disponibilidad",
              "Ubicación",
              "Descripción",
              "Acciones"
            ].map((header) => (
              <th
                key={header}
                style={{
                  textAlign: header === "Descripción" ? "left" : "center",
                  padding: "12px 16px",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "#6b7280",
                  background: "#f1f5f9"
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const isEditing = editingId === it.id;
            return (
              <tr key={it.id} style={{ borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
                <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a", minWidth: 180, textAlign: "left", overflowWrap: "anywhere" }}>
                  {isEditing ? (
                    <input
                      className="input"
                      type="text"
                      value={editForm.name ?? it.name}
                      onChange={(e) => onEditChange("name", e.target.value)}
                    />
                  ) : (
                    it.name
                  )}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
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
                    typeLabels[it.type] || it.type
                  )}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center", minWidth: 100 }}>
                  {isEditing ? (
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={editForm.quantity ?? it.quantity}
                      onChange={(e) => onEditChange("quantity", Number(e.target.value))}
                    />
                  ) : (
                    it.quantity
                  )}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
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
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      className="input"
                      type="text"
                      value={editForm.location ?? it.location ?? ""}
                      onChange={(e) => onEditChange("location", e.target.value)}
                      style={{ minWidth: 160 }}
                    />
                  ) : (
                    it.location || "—"
                  )}
                </td>
                <td style={{ padding: "14px 16px", color: "#475569", textAlign: "left", minWidth: 220 }}>
                  {isEditing ? (
                    <textarea
                      className="input"
                      value={editForm.description ?? it.description ?? ""}
                      onChange={(e) => onEditChange("description", e.target.value)}
                      rows={2}
                    />
                  ) : (
                    it.description || "—"
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
