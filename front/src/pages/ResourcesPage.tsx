import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { apiClient, Resource, ResourceCreate, ResourceUpdate } from "../services/api";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import * as Select from "@radix-ui/react-select";
import DashboardLayout from "../components/layout/DashboardLayout";
import ResourcesMetrics from "../components/resources/ResourcesMetrics";
import ResourcesFilterPanel from "../components/resources/ResourcesFilterPanel";
import ResourcesActiveFilters from "../components/resources/ResourcesActiveFilters";
import ResourcesListHeader from "../components/resources/ResourcesListHeader";
import ResourcesTable from "../components/resources/ResourcesTable";
import ResourcesCardList from "../components/resources/ResourcesCardList";
import { SlidersHorizontal, PlusCircle, Upload } from "lucide-react";

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [form, setForm] = useState<ResourceCreate>({ name: "", type: "equipo", quantity: 1, available: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
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
    a.download = `recursos_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const handleCsvFileSelect = (file: File | null) => {
    setCsvError(null);
    if (!file) {
      setCsvFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      setCsvError("Solo se aceptan archivos CSV");
      setCsvFile(null);
      return;
    }
    setCsvFile(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setUploadingCsv(true);
    setCsvError(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const response = await apiClient.uploadResourcesCsv(formData);
      
      if (response.errors && response.errors.length > 0) {
        setCsvError(`Errores encontrados: ${response.errors.join(', ')}`);
      }
      
      if (response.created > 0) {
        setCsvModalOpen(false);
        setCsvFile(null);
        await load();
      }
    } catch (err: any) {
      setCsvError(err?.message || "Error al cargar CSV");
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <DashboardLayout
      title="Recursos"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleToggleFilters} className="h-11 w-11 rounded-xl border bg-muted/40">
            <SlidersHorizontal size={18} />
          </Button>
          <Button variant="secondary" onClick={() => setCsvModalOpen(true)} className="inline-flex items-center gap-2">
            <Upload size={16} /> Importar CSV
          </Button>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2">
            <PlusCircle size={16} /> Agregar recurso
          </Button>
        </div>
      }
    >

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

      <div className="bg-card border rounded-xl p-6 flex flex-col gap-4 w-full max-w-5xl mx-auto">
        <ResourcesListHeader filteredCount={filteredItems.length} onExport={exportCSV} />

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
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
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground/80">Tipo</label>
            <Select.Root value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <Select.Trigger className="inline-flex h-9 items-center justify-between rounded-md border bg-background px-3 text-sm w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md">
                <Select.Viewport className="p-1">
                  {Object.entries({ vehiculo: "Vehículo", equipo: "Equipo", personal: "Personal", insumo: "Insumo" }).map(([value, label]) => (
                    <Select.Item key={value} value={value} className="px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-accent/40">
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Root>
          </div>
          <Input label="Cantidad" type="number" min={0} value={form.quantity || 1} onChange={(e) => setForm({ ...form, quantity: Number(e.currentTarget.value) })} />
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" checked={!!form.available} onChange={(e) => setForm({ ...form, available: e.currentTarget.checked })} />
            <span className="text-sm text-muted-foreground">Disponible</span>
          </div>
          <Input label="Ubicación" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.currentTarget.value })} />
          <div className="col-span-full">
            <label className="text-sm font-medium text-foreground/80">Descripción</label>
            <textarea className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.currentTarget.value })} />
          </div>
        </div>
        {error && <div className="text-destructive text-sm mt-2">{error}</div>}
      </Modal>

      <Modal
        open={csvModalOpen}
        title="Importar recursos desde CSV"
        onClose={() => setCsvModalOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setCsvModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCsvUpload} disabled={!csvFile || uploadingCsv}>
              {uploadingCsv ? "Cargando..." : "Importar"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sube un archivo CSV con las columnas: nombre, tipo, cantidad, disponible, ubicación, descripción
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleCsvFileSelect(e.target.files?.[0] || null)}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {csvFile && (
            <div className="text-sm text-foreground">
              Archivo seleccionado: <strong>{csvFile.name}</strong>
            </div>
          )}
          {csvError && <div className="text-destructive text-sm">{csvError}</div>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}