import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { apiClient, Resource, ResourceCreate, ResourceUpdate } from "../services/api";
import Modal from "../components/ui/Modal";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Layers, PackageCheck, PackageOpen, PlusCircle, SlidersHorizontal, Warehouse, ChevronRight, PencilLine, Trash2, Check, X } from "lucide-react";

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [form, setForm] = useState<ResourceCreate>({ name: "", type: "equipo", quantity: 1, available: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Filtros
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterAvailable, setFilterAvailable] = useState<string>("todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string>("todos");
  const [pendingAvailability, setPendingAvailability] = useState<string>("todos");
  // Edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ResourceUpdate>({});
  // Modal crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function load() {
    try {
      const list = await apiClient.listResources();
      setItems(list);
    } catch (err: any) {
      console.error(err);
    }
  }
  useEffect(() => { load(); }, []);

  async function onCreate() {
    setLoading(true);
    setError(null);
    try {
      const created = await apiClient.createResource(form);
      setItems((prev) => [created, ...prev]);
      setForm({ name: "", type: form.type || "equipo", quantity: 1, available: true });
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err?.message || "Error al crear recurso");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const typeOk = filterType === "todos" || it.type === filterType;
      const availOk = filterAvailable === "todos" || (filterAvailable === "si" ? it.available : !it.available);
      return typeOk && availOk;
    });
  }, [items, filterType, filterAvailable]);

  function startEdit(it: Resource) {
    setEditingId(it.id);
    setEditForm({
      name: it.name,
      type: it.type,
      quantity: it.quantity,
      available: it.available,
      location: it.location || undefined,
      description: it.description || undefined,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: number) {
    try {
      const updated = await apiClient.updateResource(id, editForm);
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err?.message || "Error al actualizar recurso");
    }
  }

  async function onDelete(id: number) {
    try {
      await apiClient.deleteResource(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || "Error al eliminar recurso");
    }
  }

  function exportCSV() {
    const rows = filteredItems.map((it) => [it.id, it.name, it.type, it.quantity, it.available ? "Si" : "No", it.location || "", it.description || ""]);
    const header = ["ID", "Nombre", "Tipo", "Cantidad", "Disponible", "Ubicación", "Descripción"];
    const csv = [header, ...rows].map((r) => r.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recursos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const typeLabels: Record<string, string> = {
    todos: "Todos",
    vehiculo: "Vehículo",
    equipo: "Equipo",
    personal: "Personal",
    insumo: "Insumo",
  };

  const availabilityLabels: Record<string, string> = {
    todos: "Todos",
    si: "Disponibles",
    no: "No disponibles",
  };

  return (
    <DashboardLayout
      title="Recursos"
      contentStyle={{ padding: "0 40px 32px 40px" }}
    >
      <div style={{
        margin: "0 -40px 32px",
        padding: "20px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "#9ca3af", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span>Recursos</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>Inventario de recursos</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Administra equipos, insumos y personal disponible en la operación.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button
            variant="secondary"
            onClick={() => {
              if (!filterOpen) {
                setPendingType(filterType);
                setPendingAvailability(filterAvailable);
              }
              setFilterOpen((prev) => !prev);
            }}
            style={{ width: 44, height: 44, borderRadius: 12, padding: 0, borderColor: "#e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <SlidersHorizontal size={18} />
          </Button>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={16} /> Agregar recurso
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", value: items.length, icon: Layers, color: "#4f46e5" },
          { label: "Disponibles", value: items.filter((it) => it.available).length, icon: PackageCheck, color: "#16a34a" },
          { label: "No disponibles", value: items.filter((it) => !it.available).length, icon: PackageOpen, color: "#f97316" },
          { label: "Ubicaciones", value: Array.from(new Set(items.map((it) => it.location || "Sin ubicación"))).length, icon: Warehouse, color: "#0ea5e9" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{card.label}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{card.value}</span>
              </div>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: `${card.color}1a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${card.color}33`
              }}>
                <Icon size={20} color={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {filterOpen && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: 18,
          padding: 20,
          marginBottom: 24,
          boxShadow: "0 12px 35px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexWrap: "wrap",
          gap: 20
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Tipo</span>
            <select
              className="input"
              value={pendingType}
              onChange={(e) => setPendingType(e.target.value)}
              style={{ minWidth: 220 }}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Disponibilidad</span>
            <select
              className="input"
              value={pendingAvailability}
              onChange={(e) => setPendingAvailability(e.target.value)}
              style={{ minWidth: 220 }}
            >
              {Object.entries(availabilityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingType(filterType);
                setPendingAvailability(filterAvailable);
                setFilterOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setFilterType(pendingType);
                setFilterAvailable(pendingAvailability);
                setFilterOpen(false);
              }}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {(filterType !== "todos" || filterAvailable !== "todos") && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {filterType !== "todos" && (
            <button
              type="button"
              onClick={() => setFilterType("todos")}
              style={{ border: "none", background: "#dbeafe", color: "#1d4ed8", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Tipo: {typeLabels[filterType]} ✕
            </button>
          )}
          {filterAvailable !== "todos" && (
            <button
              type="button"
              onClick={() => setFilterAvailable("todos")}
              style={{ border: "none", background: "#dbeafe", color: "#1d4ed8", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Disponibilidad: {availabilityLabels[filterAvailable]} ✕
            </button>
          )}
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Listado de recursos</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280" }}>{filteredItems.length} recursos encontrados</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={exportCSV}>Exportar CSV</Button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280", background: "#f8fafc", borderRadius: 16 }}>
            No hay recursos que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Recurso', 'Tipo', 'Cantidad', 'Disponibilidad', 'Ubicación', 'Descripción', 'Acciones'].map((header) => (
                    <th key={header} style={{ textAlign: header === 'Descripción' ? 'left' : 'center', padding: "12px 16px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, color: "#6b7280", background: "#f1f5f9" }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => (
                  <tr key={it.id} style={{ borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a", minWidth: 180, textAlign: "left" }}>
                      {editingId === it.id ? (
                        <input className="input" type="text" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      ) : (
                        it.name
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {editingId === it.id ? (
                        <select className="input" value={editForm.type || it.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
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
                      {editingId === it.id ? (
                        <input className="input" type="number" min={0} value={editForm.quantity ?? it.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })} />
                      ) : (
                        it.quantity
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {editingId === it.id ? (
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                          <input type="checkbox" checked={editForm.available ?? it.available} onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })} />
                          Disponible
                        </label>
                      ) : (
                        it.available ? <span className="badge badge-success">Disponible</span> : <span className="badge badge-danger">Sin stock</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {editingId === it.id ? (
                        <input className="input" type="text" value={editForm.location ?? it.location ?? ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} style={{ minWidth: 160 }} />
                      ) : (
                        it.location || "—"
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569", textAlign: "left", minWidth: 220 }}>
                      {editingId === it.id ? (
                        <textarea className="input" value={editForm.description ?? it.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
                      ) : (
                        it.description || "—"
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                        {editingId === it.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(it.id)}
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
                              onClick={cancelEdit}
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
                              onClick={() => startEdit(it)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={isCreateOpen}
        title="Agregar recurso"
        onClose={() => setIsCreateOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={onCreate} loading={loading} disabled={!form.name.trim()}>Crear</Button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <div>
            <label className="label">Nombre</label>
            <input className="input" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="vehiculo">Vehículo</option>
              <option value="equipo">Equipo</option>
              <option value="personal">Personal</option>
              <option value="insumo">Insumo</option>
            </select>
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input className="input" type="number" min={0} value={form.quantity || 1} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Disponible</label>
            <input type="checkbox" checked={!!form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label className="label">Ubicación</label>
            <input className="input" type="text" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label className="label">Descripción</label>
            <textarea className="input" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
      </Modal>
    </DashboardLayout>
  );
}