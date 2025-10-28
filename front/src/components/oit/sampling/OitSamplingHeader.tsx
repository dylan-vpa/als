import React from "react";
import Button from "../../ui/Button";
import { ClipboardList, Save } from "lucide-react";

interface OitSamplingHeaderProps {
  oitId: string | undefined;
  documentTitle?: string;
  canReset: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export default function OitSamplingHeader({ oitId, documentTitle, canReset, saving, onReset, onSave }: OitSamplingHeaderProps) {
  return (
    <div
      style={{
        margin: "0 calc(-1 * clamp(16px, 4vw, 40px)) 32px",
        padding: "20px clamp(16px, 4vw, 40px)",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ color: "#9ca3af", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>OIT #{oitId}</span>
            <span>·</span>
            <span>Formulario de muestreo</span>
          </div>
          <h1
            style={{
              margin: "6px 0 0 0",
              fontSize: 26,
              fontWeight: 700,
              color: "#111827",
              maxWidth: "100%",
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              lineHeight: 1.25
            }}
          >
            {documentTitle || "Sin título"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={onReset} disabled={!canReset}>
            <ClipboardList size={16} /> Reiniciar
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving || !canReset}>
            <Save size={16} /> Guardar cambios
          </Button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280", overflowWrap: "anywhere" }}>
        Completa la información de muestreo para habilitar la descarga del informe final en la vista detallada.
      </p>
    </div>
  );
}
