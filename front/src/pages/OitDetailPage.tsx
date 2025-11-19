import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/ui/Button";
import { apiClient, OitDocumentOut, RecommendationsResponse, DocumentCheckResponse, SamplingStatus } from "../services/api";
import type { SamplingData } from "../components/oit/SamplingWizard";
import OitDetailHeader from "../components/oit/detail/OitDetailHeader";
import OitDetailSummarySection from "../components/oit/detail/OitDetailSummarySection";
import OitHallazgosSection from "../components/oit/detail/OitHallazgosSection";
import OitResumenTab from "../components/oit/detail/OitResumenTab";
import OitPlanSection from "../components/oit/detail/OitPlanSection";
import OitDetailTabs from "../components/oit/detail/OitDetailTabs";

function buildBanner(document: OitDocumentOut | null): { type: "success" | "warning" | "error"; message: string } | null {
  if (!document) return null;
  const status = document.status;
  const summary = document.summary || "Sin resumen disponible.";
  if (status === "check") {
    return { type: "success", message: summary };
  }
  if (status === "alerta") {
    const detail = document.alerts?.[0] || "La IA detectó observaciones. Revisa los hallazgos.";
    return { type: "warning", message: detail };
  }
  if (status === "error") {
    const detail = document.alerts?.[0] || document.missing?.[0] || "El documento no cumple con las normas de la empresa.";
    return { type: "error", message: detail };
  }
  return null;
}

export default function OitDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<OitDocumentOut | null>(null);
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"resumen" | "hallazgos" | "plan" | "muestreo" | "analisis" | "resultados">("resumen");
  const navigate = useNavigate();

  // Muestreo + Informe state
  const [sampling, setSampling] = useState<SamplingData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState(false);
  const [samplingStatus, setSamplingStatus] = useState<SamplingStatus | null>(null);
  const [uploadingAnalysis, setUploadingAnalysis] = useState(false);
  const [exportDownloading, setExportDownloading] = useState(false);
  const analysisFileInputRef = useRef<HTMLInputElement | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  // Verificación con Llama 3.2 3B
  const [checkingDocument, setCheckingDocument] = useState(false);
  const [checkResult, setCheckResult] = useState<DocumentCheckResponse | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("llama3.2:3b");

  useEffect(() => {
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, []);

  useEffect(() => {
    const docId = Number(id);
    if (!docId) return;
    (async () => {
      try {
        const d = await apiClient.getOit(docId);
        setDoc(d);
        setBanner(buildBanner(d));
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
      } catch { }
    }
  }, [id]);

  // Estado de muestreo/análisis desde backend
  useEffect(() => {
    const docIdNum = Number(id);
    if (!docIdNum) return;
    (async () => {
      try {
        const status = await apiClient.getSamplingStatus(docIdNum);
        setSamplingStatus(status);
      } catch (e) {
        // Si aún no existe estado, ignorar
      }
    })();
  }, [id]);

  const baseCheckOk = !!doc && doc.status === "check" && (doc.alerts?.length || 0) === 0 && (doc.missing?.length || 0) === 0;
  const canViewPlan = !!doc && (doc.can_recommend ?? baseCheckOk);

  useEffect(() => {
    setBanner(buildBanner(doc));
  }, [doc]);

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

  const handleDownloadReportHtml = async () => {
    const docIdNum = Number(id);
    if (!docIdNum || !sampling) return;
    setError(null);
    setDownloadingHtml(true);
    try {
      const blob = await apiClient.downloadFinalReportHtml(
        docIdNum,
        sampling as Record<string, any>
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_final_oit_${docIdNum}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo descargar el informe HTML");
    } finally {
      setDownloadingHtml(false);
    }
  };

  const handleDownloadSamplingExport = async () => {
    const docIdNum = Number(id);
    if (!docIdNum) return;
    setError(null);
    setExportDownloading(true);
    try {
      const blob = await apiClient.downloadSamplingExport(docIdNum);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `muestreo_oit_${docIdNum}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo descargar el muestreo");
    } finally {
      setExportDownloading(false);
    }
  };

  const handleUploadAnalysisFile = async (file: File | null) => {
    const docIdNum = Number(id);
    if (!docIdNum || !file) return;
    setError(null);
    setUploadingAnalysis(true);
    try {
      const status = await apiClient.uploadAnalysis(docIdNum, file);
      setSamplingStatus(status);
      setBanner({ type: "success", message: "Análisis subido. Ya puedes generar el informe final." });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo subir el análisis");
    } finally {
      setUploadingAnalysis(false);
    }
  };

  const handleDownloadBundle = async () => {
    const docIdNum = Number(id);
    if (!docIdNum || !doc?.reference_bundle_available) return;
    setError(null);
    setDownloadingBundle(true);
    try {
      const blob = await apiClient.downloadReferenceBundle(docIdNum);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.reference_bundle_path ? doc.reference_bundle_path.split("/").pop() || `readme_oit_${docIdNum}.md` : `readme_oit_${docIdNum}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo descargar el README");
    } finally {
      setDownloadingBundle(false);
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
        const status = result.result.status;
        if (status === "check") {
          setBanner({ type: "success", message: result.result.summary || "La IA confirmó que el documento cumple." });
        } else if (status === "alerta") {
          const msg = (result.result.alerts || [])[0] || "La IA detectó observaciones. Revisa los hallazgos.";
          setBanner({ type: "warning", message: msg });
        } else if (status === "error") {
          const msg = (result.result.missing || [])[0] || "El documento no cumple con las normas.";
          setBanner({ type: "error", message: msg });
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Error al verificar el documento");
    } finally {
      setCheckingDocument(false);
    }
  };

  const bannerStyle = useMemo(() => {
    if (!banner) return undefined;
    const palette: Record<typeof banner.type, { bg: string; border: string; color: string }> = {
      success: { bg: "#ecfdf5", border: "#bbf7d0", color: "#065f46" },
      warning: { bg: "#fff7ed", border: "#fed7aa", color: "#9a3412" },
      error: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" }
    };
    return palette[banner.type];
  }, [banner]);

  const handleGeneratePlan = async ({ scheduledDatetime, notes }: { scheduledDatetime: string | null; notes: string | null }) => {
    const docIdNum = Number(id);
    if (!docIdNum) return;
    setError(null);
    setPlanLoading(true);
    try {
      const response = await apiClient.createOitPlan(docIdNum, {
        scheduled_datetime: scheduledDatetime,
        notes: notes,
      });
      setDoc(response.document);
      setRecs((prev) => (prev ? { ...prev, schedule: response.schedule ?? prev.schedule } : prev));
      setBanner({ type: "warning", message: "Programación generada. Revisa los recursos asignados y aprueba para continuar." });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo generar la programación");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleConfirmPlan = async (approved: boolean, { scheduledDatetime, notes }: { scheduledDatetime: string | null; notes: string | null }) => {
    const docIdNum = Number(id);
    if (!docIdNum || !doc) return;
    setError(null);
    setConfirmingPlan(true);
    try {
      const planPayload = doc.resource_plan ? doc.resource_plan : null;
      const gapsPayload = doc.resource_gaps ? doc.resource_gaps : null;
      const updated = await apiClient.confirmOitPlan(docIdNum, {
        approved,
        scheduled_datetime: scheduledDatetime,
        notes,
        plan: planPayload,
        gaps: gapsPayload,
      });
      setDoc(updated);
      if (approved) {
        setBanner({ type: "success", message: "Programación aprobada. Ya puedes continuar con el muestreo." });
      } else {
        setBanner({ type: "warning", message: "Programación marcada para ajustes. Actualiza los recursos y aprueba nuevamente." });
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "No se pudo registrar la decisión");
    } finally {
      setConfirmingPlan(false);
    }
  };

  if (!doc) {
    return (
      <DashboardLayout title="Detalle OIT">
        <div style={{ color: "#6b7280" }}>Cargando…</div>
      </DashboardLayout>
    );
  }

  const statusLabel = doc.status === "check" ? "Completada" : doc.status === "alerta" ? "Alerta" : "Error";
  const statusColor = doc.status === "check" ? "#16a34a" : doc.status === "alerta" ? "#f97316" : "#dc2626";

  const hallazgos = {
    alerts: doc.alerts || [],
    missing: doc.missing || [],
    evidence: doc.evidence || [],
  };

  return (
    <DashboardLayout title={`OIT #${doc.id} - ${doc.original_name || doc.filename}`}>
      <div className="space-y-6">
        {/* Header unificado y mejorado */}
        <OitDetailHeader
          doc={doc}
          statusLabel={statusLabel}
          sampling={samplingStatus?.final_report_allowed ? sampling : null}
          offline={!online}
          checkingDocument={checkingDocument}
          downloading={downloading}
          downloadingHtml={downloadingHtml}
          downloadingBundle={downloadingBundle}
          onCheckDocument={handleCheckDocument}
          onDownloadReport={handleDownloadReport}
          onDownloadReportHtml={handleDownloadReportHtml}
          onDownloadBundle={handleDownloadBundle}
        />

        {/* Contenido principal con mejor diseño */}
        <div className="space-y-6">
          {/* Resumen con mejor estética */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <OitDetailSummarySection doc={doc} statusColor={statusColor} statusLabel={statusLabel} />
          </div>

          {/* Tabs con diseño mejorado */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <OitDetailTabs
              activeTab={activeTab}
              onChange={(tab) => {
                if (tab === "muestreo") {
                  navigate(`/dashboard/oit/${doc.id}/muestreo`);
                  return;
                }
                setActiveTab(tab);
              }}
            />
            
            <div className="p-6">
              {activeTab === "resumen" && (
                <OitResumenTab doc={doc} statusColor={statusColor} statusLabel={statusLabel} />
              )}
              {activeTab === "hallazgos" && (
                <OitHallazgosSection alerts={hallazgos.alerts} missing={hallazgos.missing} evidence={hallazgos.evidence} />
              )}
              {activeTab === "plan" && (
                <OitPlanSection
                  doc={doc}
                  recs={recs}
                  canViewPlan={canViewPlan}
                  loading={planLoading}
                  confirming={confirmingPlan}
                  onGeneratePlan={handleGeneratePlan}
                  onConfirmPlan={handleConfirmPlan}
                />
              )}
              {activeTab === "analisis" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Muestreo y análisis</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {samplingStatus?.completed_at && (
                        <span>Completado: {new Date(samplingStatus.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">Exportar muestreo</h4>
                      <p className="text-sm text-slate-600 mb-3">Descarga los datos del muestreo</p>
                      <Button 
                        variant="default" 
                        onClick={handleDownloadSamplingExport} 
                        disabled={!samplingStatus?.export_available || exportDownloading}
                        className="w-full"
                      >
                        {exportDownloading ? "Descargando…" : "Descargar muestreo"}
                      </Button>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">Subir análisis</h4>
                      <p className="text-sm text-slate-600 mb-3">Carga el archivo de análisis en PDF</p>
                      <Button 
                        variant="secondary" 
                        onClick={() => analysisFileInputRef.current?.click()}
                        className="w-full"
                      >
                        Subir análisis (.pdf)
                      </Button>
                      <input 
                        ref={analysisFileInputRef} 
                        type="file" 
                        accept=".pdf,application/pdf" 
                        onChange={(e) => handleUploadAnalysisFile(e.target.files?.[0] || null)} 
                        style={{ display: "none" }} 
                      />
                      {uploadingAnalysis && (
                        <p className="text-xs text-slate-500 mt-2">Subiendo análisis…</p>
                      )}
                    </div>
                  </div>
                  
                  {samplingStatus?.final_report_allowed ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium">✓ Análisis listo. Informe final habilitado.</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">El informe final se habilita al subir el análisis.</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "resultados" && (
                <div className="space-y-4">
                  {!online && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-800 font-medium">Sin conexión</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">Las acciones que requieren conexión están deshabilitadas.</p>
                    </div>
                  )}
                  
                  {banner && bannerStyle && (
                    <div 
                      className="rounded-lg p-4 border flex items-center gap-3" 
                      style={{ background: bannerStyle.bg, borderColor: bannerStyle.border, color: bannerStyle.color }}
                    >
                      <span className="font-semibold">
                        {banner.type === "success" ? "✓ Cumple" : banner.type === "warning" ? "⚠ Revisión necesaria" : "✗ No cumple"}
                      </span>
                      <span className="flex-1">{banner.message}</span>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="primary" 
                      onClick={handleDownloadReport} 
                      disabled={!sampling || downloading || !online}
                      className="flex-1"
                    >
                      {downloading ? "Generando…" : "Descargar informe"}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleDownloadReportHtml} 
                      disabled={!sampling || downloadingHtml || !online}
                      className="flex-1"
                    >
                      {downloadingHtml ? "Generando…" : "Informe (HTML)"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}