import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import SamplingWizard, { SamplingData } from "../components/oit/SamplingWizard";
import { apiClient, OitDocumentOut } from "../services/api";
import Button from "../components/ui/Button";
import { ChevronLeft } from "lucide-react";
import OitSamplingHeader from "../components/oit/sampling/OitSamplingHeader";

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
      contentStyle={{ padding: "0 clamp(16px, 4vw, 40px) 32px", width: "100%", maxWidth: "100%" }}
    >
      <OitSamplingHeader
        oitId={id}
        documentTitle={doc?.original_name || doc?.filename || "Sin título"}
        canReset={!!sampling}
        saving={saving}
        onReset={handleReset}
        onSave={() => sampling && handleComplete(sampling)}
      />

      <div style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 24, width: "100%", maxWidth: "min(100%, 960px)", margin: "0 auto" }}>
        <SamplingWizard
          storageKey={storageKey}
          initial={sampling || undefined}
          onComplete={handleComplete}
        />
      </div>
    </DashboardLayout>
  );
}
