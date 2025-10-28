import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { apiClient, Resource, ResourceCreate, ResourceUpdate } from "../services/api";
import Modal from "../components/ui/Modal";
import DashboardLayout from "../components/layout/DashboardLayout";
import ResourcesHeader from "../components/resources/ResourcesHeader";
import ResourcesMetrics from "../components/resources/ResourcesMetrics";
import ResourcesFilterPanel from "../components/resources/ResourcesFilterPanel";
import ResourcesActiveFilters from "../components/resources/ResourcesActiveFilters";
import ResourcesListHeader from "../components/resources/ResourcesListHeader";
import ResourcesTable from "../components/resources/ResourcesTable";
import ResourcesCardList from "../components/resources/ResourcesCardList";

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
  const isWindow = typeof window !== "undefined";
  const [isCompactTable, setIsCompactTable] = useState<boolean>(() => (isWindow ? window.innerWidth < 768 : false));

  async function load() {
    try {
      const list = await apiClient.listResources();
      setItems(list);
    } catch (err: any) {
      console.error(err);
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isWindow) return;
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = (event: MediaQueryListEvent) => setIsCompactTable(event.matches);
    setIsCompactTable(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
    } else {
      mql.addListener(handler);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [isWindow]);

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

  const resourceTypeLabels: Record<string, string> = {
    vehiculo: typeLabels.vehiculo,
    equipo: typeLabels.equipo,
    personal: typeLabels.personal,
    insumo: typeLabels.insumo,
  };

  const handleToggleFilters = () => {
    if (!filterOpen) {
      setPendingType(filterType);
      setPendingAvailability(filterAvailable);
    }
    setFilterOpen((prev) => !prev);
  };

  const handleCancelFilters = () => {
    setPendingType(filterType);
    setPendingAvailability(filterAvailable);
    setFilterOpen(false);
  };

  const handleApplyFilters = () => {
    setFilterType(pendingType);
    setFilterAvailable(pendingAvailability);
    setFilterOpen(false);
  };

  const handleClearType = () => {
    setFilterType("todos");
    if (filterOpen) {
      setPendingType("todos");
    }
  };

  const handleClearAvailability = () => {
    setFilterAvailable("todos");
    if (filterOpen) {
      setPendingAvailability("todos");
    }
  };

  function handleEditChange<K extends keyof ResourceUpdate>(field: K, value: ResourceUpdate[K]) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <DashboardLayout
      title="Recursos"
      contentStyle={{ padding: "0 clamp(16px, 4vw, 40px) 32px", width: "100%", maxWidth: "100%" }}
    >
      <ResourcesHeader onToggleFilters={handleToggleFilters} onOpenCreate={() => setIsCreateOpen(true)} />

      <ResourcesMetrics items={items} />

      {filterOpen && (
        <ResourcesFilterPanel
          typeLabels={typeLabels}
          availabilityLabels={availabilityLabels}
          pendingType={pendingType}
          pendingAvailability={pendingAvailability}
          onChangeType={setPendingType}
          onChangeAvailability={setPendingAvailability}
          onCancel={handleCancelFilters}
          onApply={handleApplyFilters}
        />
      )}

      <ResourcesActiveFilters
        filterType={filterType}
        filterAvailable={filterAvailable}
        typeLabels={typeLabels}
        availabilityLabels={availabilityLabels}
        onClearType={handleClearType}
        onClearAvailability={handleClearAvailability}
      />

      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e5e7eb",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: "min(100%, 1200px)",
          margin: "0 auto"
        }}
      >
        <ResourcesListHeader filteredCount={filteredItems.length} onExport={exportCSV} />

        {filteredItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280", background: "#f8fafc", borderRadius: 16 }}>
            No hay recursos que coincidan con los filtros seleccionados.
          </div>
        ) : isCompactTable ? (
          <ResourcesCardList
            items={filteredItems}
            editingId={editingId}
            editForm={editForm}
            typeLabels={resourceTypeLabels}
            onStartEdit={startEdit}
            onEditChange={handleEditChange}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={onDelete}
          />
        ) : (
          <ResourcesTable
            items={filteredItems}
            editingId={editingId}
            editForm={editForm}
            typeLabels={resourceTypeLabels}
            onStartEdit={startEdit}
            onEditChange={handleEditChange}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={onDelete}
          />
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
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