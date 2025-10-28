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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>Panel de OITs</h1>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            Visualiza el progreso de las órdenes internas de trabajo y toma decisiones informadas.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button
            variant="secondary"
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
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              padding: 0,
              fontSize: 13,
              color: "#1f2937",
              borderColor: "#e5e7eb",
              background: "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <SlidersHorizontal size={18} />
          </Button>
          <Button
            variant="primary"
            onClick={() => setOpenUpload(true)}
            style={{ background: "#1e3a8a", borderColor: "#1e3a8a", color: "white" }}
          >
            <FilePlus size={16} /> Subir OIT
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 18, padding: 20, marginBottom: 24, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)", display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Tipo de documento</span>
            <div ref={typeDropdownRef} style={{ position: "relative", minWidth: 200 }}>
              <button
                type="button"
                onClick={() => setTypeDropdownOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#111827",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)"
                }}
              >
                {typeLabels[pendingFilterType] ?? "Seleccionar"}
                <span style={{ fontSize: 14, color: "#9ca3af" }}>▾</span>
              </button>
              {typeDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPendingFilterType(value);
                        setTypeDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 13,
                        background: value === pendingFilterType ? "#eef2ff" : "#ffffff",
                        color: value === pendingFilterType ? "#4338ca" : "#111827",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Estado</span>
            <div ref={statusDropdownRef} style={{ position: "relative", minWidth: 200 }}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#111827",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)"
                }}
              >
                {statusLabels[pendingFilterStatus] ?? "Seleccionar"}
                <span style={{ fontSize: 14, color: "#9ca3af" }}>▾</span>
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPendingFilterStatus(value);
                        setStatusDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 13,
                        background: value === pendingFilterStatus ? "#fee2e2" : "#ffffff",
                        color: value === pendingFilterStatus ? "#b91c1c" : "#111827",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 8 }}>
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {filterType !== "todos" && (
            <button
              type="button"
              onClick={() => { setFilterType("todos"); if (filterOpen) setPendingFilterType("todos"); }}
              style={{
                border: "none",
                background: "#eef2ff",
                color: "#4338ca",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Tipo: {filterType} ✕
            </button>
          )}
          {filterStatus !== "todos" && (
            <button
              type="button"
              onClick={() => { setFilterStatus("todos"); if (filterOpen) setPendingFilterStatus("todos"); }}
              style={{
                border: "none",
                background: "#dbeafe",
                color: "#1d4ed8",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Estado: {statusLabels[filterStatus] ?? filterStatus} ✕
            </button>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 32 }}>
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: "#ffffff",
                borderRadius: 24,
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{card.caption}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{card.value}</span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{card.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: card.accent }}>{card.badge}</span>
              </div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `conic-gradient(${card.accent} ${card.progress}%, #e5e7eb ${card.progress}% 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #f3f4f6"
                }}>
                  <IconComponent size={16} color={card.accent} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#111827" }}>Listado de OITs</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280" }}>Tus documentos más recientes y su estado actual.</p>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Cargando…</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>No hay OITs cargadas aún.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredItems.map((i) => {
              const statusBadge = (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      i.status === "check"
                        ? "rgba(34,197,94,0.12)"
                        : i.status === "alerta"
                        ? "rgba(249,115,22,0.12)"
                        : "rgba(239,68,68,0.12)",
                    color:
                      i.status === "check"
                        ? "#16a34a"
                        : i.status === "alerta"
                        ? "#f97316"
                        : "#dc2626"
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }}></span>
                  {i.status === "check" ? "Completada" : i.status === "alerta" ? "Alerta" : "Error"}
                </span>
              );
              const initials = (i.original_name || i.filename || "").slice(0, 1).toUpperCase();
              return (
                <div
                  key={i.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr) 140px 120px",
                    alignItems: "center",
                    background: "#f8fafc",
                    borderRadius: 20,
                    padding: "18px 20px",
                    border: "1px solid #eef2f7"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: "#e0e7ff",
                        color: "#1e3a8a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700
                      }}
                    >
                      {initials || "O"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{i.original_name || i.filename}</span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>ID #{i.id}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{new Date(i.created_at).toLocaleString()}</div>
                  <div>{statusBadge}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link className="btn btn-secondary" to={`/dashboard/oit/${i.id}`} style={{ borderRadius: 999, fontSize: 13 }}>
                      Ver detalle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: "#6b7280" }}>
        Última sincronización: {stats.lastUpdated || "Sin registros"}
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