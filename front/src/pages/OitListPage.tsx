import React, { useEffect, useMemo, useState, useRef } from "react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { apiClient, OitDocumentOut } from "../services/api";
import { Link } from "react-router-dom";
import { UploadCloud, FileText, AlertTriangle, CheckCircle2, Clock, FilePlus, Paperclip, Trash2, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";

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
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const statCards = [
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
        <div className="oit-toolbar">
          <div className="oit-toolbar__copy">
            <h1>Panel de OITs</h1>
            <p>Visualiza el progreso de las órdenes internas de trabajo y toma decisiones informadas.</p>
          </div>
          <div className="oit-toolbar__actions">
            <Button
              variant="secondary"
              className="oit-toolbar__filter-btn"
              onClick={() => {
                if (!filterOpen) {
                  setPendingFilterType(filterType);
                  setPendingFilterStatus(filterStatus);
                  setFilterOpen(true);
                } else {
                  setFilterOpen(false);
                }
              }}
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal size={18} />
            </Button>
            <Button
              variant="primary"
              className="oit-toolbar__upload-btn"
              onClick={() => setOpenUpload(true)}
            >
              <FilePlus size={16} /> Subir OIT
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div className="oit-filter-panel">
            <div className="oit-filter-field" ref={typeDropdownRef}>
              <span>Tipo de documento</span>
              <button
                type="button"
                className="oit-filter-field__trigger"
                onClick={() => setTypeDropdownOpen((prev) => !prev)}
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
                      onClick={() => {
                        setPendingFilterType(value);
                        setTypeDropdownOpen(false);
                      }}
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
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
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
                      onClick={() => {
                        setPendingFilterStatus(value);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="oit-filter-actions">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterType("todos");
                  setFilterStatus("todos");
                  setPendingFilterType("todos");
                  setPendingFilterStatus("todos");
                  setFilterOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => { setFilterType(pendingFilterType); setFilterStatus(pendingFilterStatus); setFilterOpen(false); }}>Aplicar</Button>
            </div>
          </div>
        )}

        {(filterType !== "todos" || filterStatus !== "todos") && (
          <div className="oit-active-filters">
            {filterType !== "todos" && (
              <button
                type="button"
                className="oit-chip oit-chip--type"
                onClick={() => { setFilterType("todos"); if (filterOpen) setPendingFilterType("todos"); }}
              >
                Tipo: {filterType} ✕
              </button>
            )}
            {filterStatus !== "todos" && (
              <button
                type="button"
                className="oit-chip oit-chip--status"
                onClick={() => { setFilterStatus("todos"); if (filterOpen) setPendingFilterStatus("todos"); }}
              >
                Estado: {statusLabels[filterStatus] ?? filterStatus} ✕
              </button>
            )}
          </div>
        )}

        <div className="oit-stats-grid">
          {statCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div key={card.label} className="oit-stats-card">
                <div className="oit-stats-card__info">
                  <span className="oit-stats-card__caption">{card.caption}</span>
                  <span className="oit-stats-card__value">{card.value}</span>
                  <span className="oit-stats-card__label">{card.label}</span>
                  <span className="oit-stats-card__badge" style={{ color: card.accent }}>{card.badge}</span>
                </div>
                <div
                  className="oit-stats-card__meter"
                  style={{ background: `conic-gradient(${card.accent} ${card.progress}%, #e5e7eb ${card.progress}% 100%)` }}
                >
                  <div className="oit-stats-card__meter-inner">
                    <IconComponent size={16} color={card.accent} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="oit-list-wrapper">
          <div className="oit-list-header">
            <div>
              <h2>Listado de OITs</h2>
              <p>Tus documentos más recientes y su estado actual.</p>
            </div>
          </div>
          {loading ? (
            <div className="oit-placeholder">Cargando…</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="oit-placeholder">No hay OITs cargadas aún.</div>
          ) : (
            <div className="oit-list">
              {filteredItems.map((i) => {
                const statusClass = `oit-status-badge oit-status-badge--${i.status}`;
                const initials = (i.original_name || i.filename || "").slice(0, 1).toUpperCase();
                return (
                  <div key={i.id} className="oit-item">
                    <div className="oit-item__meta">
                      <div className="oit-item__avatar">{initials || "O"}</div>
                      <div className="oit-item__details">
                        <span className="oit-item__title">{i.original_name || i.filename}</span>
                        <span className="oit-item__subtitle">ID #{i.id}</span>
                      </div>
                    </div>
                    <div className="oit-item__date">{new Date(i.created_at).toLocaleString()}</div>
                    <div className="oit-item__status">
                      <span className={statusClass}>
                        <span className="oit-status-badge__dot" />
                        {i.status === "check" ? "Completada" : i.status === "alerta" ? "Alerta" : "Error"}
                      </span>
                    </div>
                    <div className="oit-item__cta">
                      <Link className="btn btn-secondary" to={`/dashboard/oit/${i.id}`}>
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="oit-sync">Última sincronización: {stats.lastUpdated || "Sin registros"}</div>
      </div>

      <Modal
        open={openUpload}
        title="Subir nueva OIT"
        onClose={() => setOpenUpload(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpenUpload(false)}>Cancelar</Button>
            <Button variant="primary" onClick={doUpload} loading={uploading} disabled={!file}>Subir OIT</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "#1d4ed8" : "#cbd5f5"}`,
              background: isDragging ? "#eef2ff" : "#f8fafc",
              borderRadius: 16,
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UploadCloud size={26} color="white" />
              </div>
              <div style={{ fontWeight: 600, color: "#1e3a8a", fontSize: 16 }}>Arrastra tu archivo aquí</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>o haz clic para seleccionarlo. Se admiten formatos PDF, TXT y MD.</div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />

          {file && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "#f1f5f9",
              borderRadius: 12,
              padding: "12px 16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Paperclip size={18} color="#1e293b" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{Math.ceil(file.size / 1024)} KB</div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => handleFileSelect(null)}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Trash2 size={16} /> Quitar
              </button>
            </div>
          )}

          {uploadError && (
            <div className="error" style={{ marginTop: 4 }}>{uploadError}</div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}