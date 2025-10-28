import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiClient, OitDocumentOut, RecommendationsResponse, RecommendationItem, DocumentCheckResponse } from "../services/api";
import type { SamplingData } from "../components/oit/SamplingWizard";
import OitDetailHeader from "../components/oit/detail/OitDetailHeader";
import OitDetailSummarySection from "../components/oit/detail/OitDetailSummarySection";
import OitDetailTabs from "../components/oit/detail/OitDetailTabs";
import OitHallazgosSection from "../components/oit/detail/OitHallazgosSection";
import OitRecursosSection from "../components/oit/detail/OitRecursosSection";
import OitResumenTab from "../components/oit/detail/OitResumenTab";

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

  const statusLabel = doc.status === "check" ? "Completada" : doc.status === "alerta" ? "Alerta" : "Error";
  const statusColor = doc.status === "check" ? "#16a34a" : doc.status === "alerta" ? "#f97316" : "#dc2626";

  const hallazgos = {
    alerts: doc.alerts || [],
    missing: doc.missing || [],
    evidence: doc.evidence || [],
  };

  return (
    <DashboardLayout title="Detalle OIT">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <OitDetailHeader
          doc={doc}
          statusLabel={statusLabel}
          sampling={sampling}
          checkingDocument={checkingDocument}
          downloading={downloading}
          onCheckDocument={handleCheckDocument}
          onDownloadReport={handleDownloadReport}
        />

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
          {activeTab === "recursos" && (
            <OitRecursosSection canViewRecs={canViewRecs} recs={recs} />
          )}
        </OitDetailTabs>
      </div>
    </DashboardLayout>
  );
}