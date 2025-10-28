import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import SamplingWizard, { SamplingData } from "../components/oit/SamplingWizard";
import { apiClient, OitDocumentOut } from "../services/api";
import Button from "../components/ui/Button";
import { ChevronLeft, ClipboardList, Save } from "lucide-react";

export default function OitSamplingPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<OitDocumentOut | null>(null);
  const [sampling, setSampling] = useState<SamplingData | null>(null);
  const [saving, setSaving] = useState(false);
  const storageKey = `oit_sampling_${id}`;

  useEffect(() => {
    const docId = Number(id);
    if (!docId) return;
    (async () => {
      try {
        const detail = await apiClient.getOit(docId);
        setDoc(detail);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setSampling(JSON.parse(raw));
      } catch (error) {
        console.error("Error parsing sampling data", error);
      }
    }
  }, [id, storageKey]);

  function handleComplete(data: SamplingData) {
    setSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSampling(data);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    localStorage.removeItem(storageKey);
    setSampling(null);
  }

  return (
    <DashboardLayout
      title="Muestreo OIT"
      contentStyle={{ padding: "0 40px 32px 40px" }}
    >
      <div
        style={{
          margin: "0 -40px 32px",
          padding: "20px 40px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "#9ca3af", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <span>OIT #{id}</span>
              <span>·</span>
              <span>Formulario de muestreo</span>
            </div>
            <h1 style={{ margin: "6px 0 0 0", fontSize: 26, fontWeight: 700, color: "#111827" }}>
              {doc?.original_name || doc?.filename || "Sin título"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={handleReset} disabled={!sampling}>
              <ClipboardList size={16} /> Reiniciar
            </Button>
            <Button variant="primary" onClick={() => sampling && handleComplete(sampling)} disabled={saving || !sampling}>
              <Save size={16} /> Guardar cambios
            </Button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Completa la información de muestreo para habilitar la descarga del informe final en la vista detallada.
        </p>
      </div>

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 24 }}>
        <SamplingWizard
          storageKey={storageKey}
          initial={sampling || undefined}
          onComplete={handleComplete}
        />
      </div>
    </DashboardLayout>
  );
}
