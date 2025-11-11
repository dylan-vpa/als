import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiClient, OitDocumentOut, RecommendationsResponse, DocumentCheckResponse } from "../services/api";
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
  const [activeTab, setActiveTab] = useState<"resumen" | "hallazgos" | "plan">("resumen");

  // Muestreo + Informe state
  const [sampling, setSampling] = useState<SamplingData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState(false);

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
      } catch {}
    }
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
    <DashboardLayout
      title="Detalle OIT"
      contentStyle={{ padding: "0 clamp(16px, 4vw, 40px) 32px", width: "100%", maxWidth: "100%" }}
    >
      <div className="dashboard-subheader dashboard-subheader--wide dashboard-subheader--static" style={{ paddingTop: 0 }}>
        <OitDetailHeader
          doc={doc}
          statusLabel={statusLabel}
          sampling={sampling}
          checkingDocument={checkingDocument}
          downloading={downloading}
          downloadingBundle={downloadingBundle}
          onCheckDocument={handleCheckDocument}
          onDownloadReport={handleDownloadReport}
          onDownloadBundle={handleDownloadBundle}
        />
      </div>

      {banner && bannerStyle && (
        <div
          style={{
            margin: "0 0 24px",
            padding: "12px 18px",
            borderRadius: 16,
            background: bannerStyle.bg,
            border: `1px solid ${bannerStyle.border}`,
            color: bannerStyle.color,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <span style={{ fontWeight: 600 }}>{banner.type === "success" ? "Cumple" : banner.type === "warning" ? "Revisión necesaria" : "No cumple"}</span>
          <span style={{ flex: 1 }}>{banner.message}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            margin: "0 0 16px",
            padding: "12px 18px",
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 13
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <OitDetailSummarySection doc={doc} statusColor={statusColor} statusLabel={statusLabel} />

        <OitDetailTabs activeTab={activeTab} onChange={setActiveTab}>
          {activeTab === "resumen" && (
            <OitResumenTab doc={doc} statusColor={statusColor} statusLabel={statusLabel} />
          )}
          {activeTab === "hallazgos" && (
            <OitHallazgosSection
              alerts={hallazgos.alerts}
              missing={hallazgos.missing}
              evidence={hallazgos.evidence}
            />
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
        </OitDetailTabs>
      </div>
    </DashboardLayout>
  );
}