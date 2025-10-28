import React, { useEffect, useMemo, useState, useRef } from "react";
import { apiClient, OitDocumentOut } from "../services/api";
import { FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import OitToolbar from "../components/oit/list/OitToolbar";
import OitFilterPanel from "../components/oit/list/OitFilterPanel";
import OitActiveFilters from "../components/oit/list/OitActiveFilters";
import OitStatsGrid, { OitStatCard } from "../components/oit/list/OitStatsGrid";
import OitListSection from "../components/oit/list/OitListSection";
import OitUploadModal from "../components/oit/list/OitUploadModal";

export default function OitListPage() {
  const [items, setItems] = useState<OitDocumentOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openUpload, setOpenUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilterType, setPendingFilterType] = useState<string>("todos");
  const [pendingFilterStatus, setPendingFilterStatus] = useState<string>("todos");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listOit();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Error al cargar OITs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!filterOpen) {
      setTypeDropdownOpen(false);
      setStatusDropdownOpen(false);
    }
  }, [filterOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!filterOpen) return;
      const target = event.target as Node;
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) {
        setTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const typeOk = filterType === "todos" || item.type === filterType;
      const statusOk = filterStatus === "todos" || item.status === filterStatus;
      return typeOk && statusOk;
    });
  }, [items, filterType, filterStatus]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const byStatus: Record<string, number> = { check: 0, alerta: 0, error: 0 };
    filteredItems.forEach((i) => {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    });
    const last = filteredItems
      .map((i) => new Date(i.created_at).getTime())
      .sort((a, b) => b - a)[0];
    return {
      total,
      check: byStatus["check"] || 0,
      alerta: byStatus["alerta"] || 0,
      error: byStatus["error"] || 0,
      lastUpdated: last ? new Date(last).toLocaleString() : null,
    };
  }, [filteredItems]);

  const statCards: OitStatCard[] = [
    {
      label: "OITs registradas",
      value: stats.total,
      caption: "Total histórico",
      accent: "#4f46e5",
      icon: FileText,
      badge: stats.lastUpdated ? `Actualizado ${new Date(stats.lastUpdated).toLocaleDateString()}` : "Sin movimientos recientes",
      progress: stats.total ? 100 : 0,
    },
    {
      label: "En revisión",
      value: stats.alerta,
      caption: "Requieren acción",
      accent: "#f97316",
      icon: AlertTriangle,
      badge: stats.total ? `${Math.round((stats.alerta / stats.total) * 100)}% del total` : "—",
      progress: stats.total ? Math.min(100, Math.round((stats.alerta / stats.total) * 100)) : 0,
    },
    {
      label: "Completadas",
      value: stats.check,
      caption: "Aprobadas",
      accent: "#16a34a",
      icon: CheckCircle2,
      badge: stats.total ? `${Math.round((stats.check / stats.total) * 100)}% del total` : "—",
      progress: stats.total ? Math.min(100, Math.round((stats.check / stats.total) * 100)) : 0,
    },
    {
      label: "Errores",
      value: stats.error,
      caption: "Requieren revisión",
      accent: "#dc2626",
      icon: Clock,
      badge: stats.total ? `${Math.round((stats.error / stats.total) * 100)}% del total` : "—",
      progress: stats.total ? Math.min(100, Math.round((stats.error / stats.total) * 100)) : 0,
    },
  ];

  const recentItems = filteredItems.slice(0, 5);

  const typeLabels: Record<string, string> = {
    todos: "Todos",
    vehiculo: "Vehículo",
    equipo: "Equipo",
    personal: "Personal",
    insumo: "Insumo",
  };

  const statusLabels: Record<string, string> = {
    todos: "Todos",
    check: "Completada",
    alerta: "Alerta",
    error: "Error",
  };

  function handleFileSelect(f: File | null) {
    setUploadError(null);
    if (!f) { setFile(null); return; }
    const allowed = ["pdf", "txt", "md"];
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setUploadError("Formato no admitido. Usa PDF, TXT o MD.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFileSelect(f || null);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function doUpload() {
    if (!file) return;
    setUploading(true);
    try {
      await apiClient.uploadOit(file);
      setOpenUpload(false);
      setFile(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <DashboardLayout title="OITs">
      <div className="oit-page">
        <OitToolbar
          onToggleFilters={() => {
            if (!filterOpen) {
              setPendingFilterType(filterType);
              setPendingFilterStatus(filterStatus);
              setFilterOpen(true);
            } else {
              setFilterOpen(false);
            }
          }}
          onOpenUpload={() => setOpenUpload(true)}
        />

        {filterOpen && (
          <OitFilterPanel
            typeDropdownRef={typeDropdownRef}
            statusDropdownRef={statusDropdownRef}
            typeLabels={typeLabels}
            statusLabels={statusLabels}
            pendingFilterType={pendingFilterType}
            pendingFilterStatus={pendingFilterStatus}
            typeDropdownOpen={typeDropdownOpen}
            statusDropdownOpen={statusDropdownOpen}
            onToggleTypeDropdown={() => setTypeDropdownOpen((prev) => !prev)}
            onToggleStatusDropdown={() => setStatusDropdownOpen((prev) => !prev)}
            onSelectPendingType={(value) => {
              setPendingFilterType(value);
              setTypeDropdownOpen(false);
            }}
            onSelectPendingStatus={(value) => {
              setPendingFilterStatus(value);
              setStatusDropdownOpen(false);
            }}
            onCancel={() => {
              setFilterType("todos");
              setFilterStatus("todos");
              setPendingFilterType("todos");
              setPendingFilterStatus("todos");
              setFilterOpen(false);
            }}
            onApply={() => {
              setFilterType(pendingFilterType);
              setFilterStatus(pendingFilterStatus);
              setFilterOpen(false);
            }}
          />
        )}

        <OitActiveFilters
          filterType={filterType}
          filterStatus={filterStatus}
          statusLabels={statusLabels}
          onClearType={() => {
            setFilterType("todos");
            if (filterOpen) setPendingFilterType("todos");
          }}
          onClearStatus={() => {
            setFilterStatus("todos");
            if (filterOpen) setPendingFilterStatus("todos");
          }}
        />

        <OitStatsGrid statCards={statCards} />

        <OitListSection items={filteredItems} loading={loading} error={error} />

        <div className="oit-sync">Última sincronización: {stats.lastUpdated || "Sin registros"}</div>
      </div>

      <OitUploadModal
        open={openUpload}
        uploading={uploading}
        uploadError={uploadError}
        file={file}
        isDragging={isDragging}
        onClose={() => setOpenUpload(false)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onFileSelect={handleFileSelect}
        onUpload={doUpload}
      />
    </DashboardLayout>
  );
}