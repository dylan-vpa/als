import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiClient, OitDocumentOut, RecommendationsResponse, RecommendationItem, DocumentCheckResponse } from "../services/api";
import { AlertTriangle, Boxes, ClipboardList, FileDown, Check, ChevronRight, CalendarDays, Info, RefreshCcw } from "lucide-react";
import type { SamplingData } from "../components/oit/SamplingWizard";
import Button from "../components/ui/Button";

export default function OitDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<OitDocumentOut | null>(null);
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"resumen" | "hallazgos" | "recursos">("resumen");

  // Muestreo + Informe state
  const [sampling, setSampling] = useState<SamplingData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificación con Llama 3.2 3B
  const [checkingDocument, setCheckingDocument] = useState(false);
  const [checkResult, setCheckResult] = useState<DocumentCheckResponse | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("llama3.2:3b");

  useEffect(() => {
    const docId = Number(id);
    if (!docId) return;
    (async () => {
      try {
        const d = await apiClient.getOit(docId);
        setDoc(d);
        const r = await apiClient.getOitRecommendations(docId);
        setRecs(r);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);
  
  // Cargar modelos disponibles
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await apiClient.getAvailableModels();
        setAvailableModels(response.models);
        // Si llama3.2:3b está disponible, seleccionarlo por defecto
        if (response.models.includes("llama3.2:3b")) {
          setSelectedModel("llama3.2:3b");
        } else if (response.models.length > 0) {
          setSelectedModel(response.models[0]);
        }
      } catch (e) {
        console.error("Error al cargar modelos:", e);
      }
    }
    fetchModels();
  }, []);

  // Carga inicial de muestreo desde localStorage
  useEffect(() => {
    const docIdNum = Number(id);
    if (!docIdNum) return;
    const key = `oit_sampling_${docIdNum}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setSampling(JSON.parse(raw));
      } catch {}
    }
  }, [id]);

  const canViewRecs =
    !!doc &&
    doc.status === "check" &&
    (doc.alerts?.length || 0) === 0 &&
    (doc.missing?.length || 0) === 0;

  const handleDownloadReport = async () => {
    const docIdNum = Number(id);
    if (!docIdNum || !sampling) return;
    setError(null);
    setDownloading(true);
    try {
      const blob = await apiClient.downloadFinalReport(
        docIdNum,
        sampling as Record<string, any>
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_final_oit_${docIdNum}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo descargar el informe");
    } finally {
      setDownloading(false);
    }
  };
  
  // Verificar documento con Llama 3.2 3B
  const handleCheckDocument = async () => {
    const docIdNum = Number(id);
    if (!docIdNum) return;
    setError(null);
    setCheckingDocument(true);
    try {
      const result = await apiClient.checkDocument(docIdNum, selectedModel);
      setCheckResult(result);
      // Actualizar el documento con los resultados si es necesario
      if (result.result) {
        // Podríamos actualizar el documento con los resultados si es necesario
        console.log("Verificación completada:", result);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Error al verificar el documento");
    } finally {
      setCheckingDocument(false);
    }
  };

  if (!doc) {
    return (
      <DashboardLayout title="Detalle OIT">
        <div style={{ color: "#6b7280" }}>Cargando…</div>
      </DashboardLayout>
    );
  }

  const tabs: { key: typeof activeTab; label: string; icon: React.ElementType }[] = [
    { key: "resumen", label: "Resumen", icon: Info },
    { key: "hallazgos", label: "Hallazgos", icon: AlertTriangle },
    { key: "recursos", label: "Recursos", icon: Boxes },
  ];

  const statusLabel = doc.status === "check" ? "Completada" : doc.status === "alerta" ? "Alerta" : "Error";
  const statusColor = doc.status === "check" ? "#16a34a" : doc.status === "alerta" ? "#f97316" : "#dc2626";

  const summaryBlocks = [
    {
      label: "Archivo",
      value: doc.original_name || doc.filename,
    },
    {
      label: "Fecha de carga",
      value: new Date(doc.created_at).toLocaleString(),
    },
    {
      label: "Estado actual",
      value: statusLabel,
      badge: true,
    },
  ];

  const hallazgos = {
    alerts: doc.alerts || [],
    missing: doc.missing || [],
    evidence: doc.evidence || [],
  };

  const renderResumen = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 15, color: "#4b5563" }}>
        {doc.summary || "Sin resumen disponible."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {summaryBlocks.map((block) => (
          <div key={block.label} style={{ background: "#f8fafc", borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{block.label}</div>
            {block.badge ? (
              <span style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: `${statusColor}1a`,
                color: statusColor,
                fontWeight: 600,
                fontSize: 13,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
                {block.value}
              </span>
            ) : (
              <div style={{
                marginTop: 10,
                fontWeight: 600,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                maxWidth: "100%"
              }}>{block.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderHallazgos = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {[
        { title: "Alertas", list: hallazgos.alerts },
        { title: "Faltantes", list: hallazgos.missing },
        { title: "Evidencias", list: hallazgos.evidence },
      ].map((section) => (
        <div key={section.title} style={{ background: "#f8fafc", borderRadius: 18, padding: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{section.title}</h3>
          {section.list.length === 0 ? (
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#6b7280" }}>Sin registros.</p>
          ) : (
            <ul style={{ margin: "12px 0 0 18px", color: "#374151", fontSize: 13, lineHeight: 1.5 }}>
              {section.list.map((item, idx) => <li key={`${section.title}-${idx}`}>{item}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );

  const renderRecursos = () => {
    if (!canViewRecs) {
      return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Disponible cuando el estado sea "check" sin alertas ni faltantes.</p>;
    }
    if (!recs) {
      return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Cargando recomendaciones…</p>;
    }
    if ((recs.recommendations || []).length === 0) {
      return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No se detectaron necesidades adicionales.</p>;
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {recs.recommendations.map((item, index) => (
          <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{item.name}</span>
              <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>{item.type}</span>
            </div>
            <span style={{ fontSize: 13, color: "#475569" }}>Cantidad sugerida: <strong>{item.quantity}</strong></span>
            <span style={{ fontSize: 13, color: "#475569" }}>{item.reason}</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Coincidencias: {recs.matches?.[item.type]?.length ? recs.matches[item.type].map((r) => r.name).join(", ") : "—"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Detalle OIT"
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
            <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
            <ChevronRight size={14} />
            <Link to="/dashboard/oit" style={{ color: "inherit", textDecoration: "none" }}>OITs</Link>
            <ChevronRight size={14} />
            <span>OIT #{doc.id}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>{doc.original_name || doc.filename}</h1>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#6b7280", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={14} /> {new Date(doc.created_at).toLocaleString()}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} /> Estado: {statusLabel}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to={`/dashboard/oit/${doc.id}/muestreo`} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={16} /> Ir a muestreo
          </Link>
          <Button
            variant="secondary"
            onClick={handleCheckDocument}
            disabled={checkingDocument}
            loading={checkingDocument}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCcw size={16} /> Verificar IA
          </Button>
          <Button variant="primary" onClick={handleDownloadReport} disabled={!sampling || downloading}>
            <FileDown size={16} /> {downloading ? "Generando…" : "Descargar informe"}
          </Button>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", marginBottom: 24, padding: 20, display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Resumen</div>
          <h2 style={{ margin: "8px 0 12px 0", fontSize: 22, fontWeight: 700, color: "#111827" }}>Estado general</h2>
          <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>{doc.summary || "Sin resumen disponible."}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, flex: 1 }}>
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Archivo</span>
            <div style={{ marginTop: 6, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "100%" }}>{doc.original_name || doc.filename}</div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Creado</span>
            <div style={{ marginTop: 6, fontWeight: 600, color: "#0f172a" }}>{new Date(doc.created_at).toLocaleDateString()}</div>
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.6 }}>Estado</span>
            <div style={{ marginTop: 6 }}>
              {doc.status === "check" && <span className="badge badge-success">Completada</span>}
              {doc.status === "alerta" && <span className="badge badge-warning">Alerta</span>}
              {doc.status === "error" && <span className="badge badge-danger">Error</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", marginBottom: 24 }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 12px" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  border: "none",
                  background: "none",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#1d4ed8" : "#6b7280",
                  borderBottom: isActive ? "3px solid #1d4ed8" : "3px solid transparent",
                  cursor: "pointer"
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === "resumen" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>Alertas</h3>
                {(doc.alerts || []).length === 0 ? (
                  <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#6b7280" }}>Sin alertas.</p>
                ) : (
                  <ul style={{ margin: "12px 0 0 18px", color: "#374151", fontSize: 13 }}>
                    {doc.alerts?.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                )}
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>Faltantes</h3>
                {(doc.missing || []).length === 0 ? (
                  <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#6b7280" }}>Sin faltantes.</p>
                ) : (
                  <ul style={{ margin: "12px 0 0 18px", color: "#374151", fontSize: 13 }}>
                    {doc.missing?.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                )}
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 18, padding: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>Evidencias</h3>
                {(doc.evidence || []).length === 0 ? (
                  <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#6b7280" }}>Sin evidencia disponible.</p>
                ) : (
                  <ul style={{ margin: "12px 0 0 18px", color: "#374151", fontSize: 13 }}>
                    {doc.evidence?.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === "hallazgos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>Hallazgos detallados</h3>
              <div style={{ background: "#f8fafc", borderRadius: 16, padding: 20 }}>
                {(doc.alerts || []).length === 0 && (doc.missing || []).length === 0 && (doc.evidence || []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Este documento no presenta hallazgos.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                    <section>
                      <h4 style={{ margin: 0, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Alertas</h4>
                      <ul style={{ margin: "10px 0 0 18px", color: "#374151", fontSize: 13 }}>
                        {(doc.alerts || []).map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </section>
                    <section>
                      <h4 style={{ margin: 0, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Faltantes</h4>
                      <ul style={{ margin: "10px 0 0 18px", color: "#374151", fontSize: 13 }}>
                        {(doc.missing || []).map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </section>
                    <section>
                      <h4 style={{ margin: 0, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Evidencias</h4>
                      <ul style={{ margin: "10px 0 0 18px", color: "#374151", fontSize: 13 }}>
                        {(doc.evidence || []).map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </section>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "recursos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>Recomendaciones de recursos</h3>
              {!canViewRecs ? (
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Disponible cuando el estado sea "check" sin alertas ni faltantes.
                </p>
              ) : !recs ? (
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Cargando recomendaciones…</p>
              ) : (recs.recommendations || []).length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No se detectaron necesidades adicionales.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {recs.recommendations.map((item, index) => (
                    <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{item.name}</span>
                        <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>{item.type}</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#475569" }}>Cantidad sugerida: <strong>{item.quantity}</strong></span>
                      <span style={{ fontSize: 13, color: "#475569" }}>{item.reason}</span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        Coincidencias: {recs.matches?.[item.type]?.length ? recs.matches[item.type].map((r) => r.name).join(", ") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {(checkingDocument || checkResult) && (
        <div style={{ background: "#f8fafc", borderRadius: 18, border: "1px solid #e2e8f0", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Resultado de verificación IA</h3>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{new Date().toLocaleString()}</span>
          </div>
          {checkingDocument && <div style={{ fontSize: 13, color: "#6b7280" }}>Ejecutando verificación…</div>}
          {checkResult && (
            <>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#334155", margin: 0 }}>
                {JSON.stringify(checkResult.result, null, 2)}
              </pre>
              {checkResult.used_fallback && (
                <p style={{ margin: "12px 0 0 0", fontSize: 12, color: "#dc2626" }}>
                  Se utilizó el modelo de respaldo porque el modelo seleccionado no estaba disponible.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}