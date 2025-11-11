import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FileDown, RefreshCcw, ChevronRight, CalendarDays, Info } from "lucide-react";
import Button from "../../ui/Button";
import { OitDocumentOut } from "../../../services/api";
import type { SamplingData } from "../SamplingWizard";

interface OitDetailHeaderProps {
  doc: OitDocumentOut;
  statusLabel: string;
  sampling: SamplingData | null;
  checkingDocument: boolean;
  downloading: boolean;
  downloadingBundle: boolean;
  onCheckDocument: () => void;
  onDownloadReport: () => void;
  onDownloadBundle: () => void;
}

export default function OitDetailHeader({
  doc,
  statusLabel,
  sampling,
  checkingDocument,
  downloading,
  downloadingBundle,
  onCheckDocument,
  onDownloadReport,
  onDownloadBundle
}: OitDetailHeaderProps) {
  const samplingDisabled = !(doc.can_sample ?? false);
  const pendingGaps = doc.pending_gap_count ?? 0;
  const samplingHelper = samplingDisabled
    ? pendingGaps > 0
      ? "No se puede iniciar el muestreo porque faltan recursos por conseguir."
      : "Aprueba el plan para habilitar el muestreo."
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 280px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13, flexWrap: "wrap" }}>
          <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
          <ChevronRight size={14} />
          <Link to="/dashboard/oit" style={{ color: "inherit", textDecoration: "none" }}>Órdenes internas de trabajo</Link>
          <ChevronRight size={14} />
          <span>OIT #{doc.id}</span>
        </div>
        <h1
          style={{
            margin: 0,
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
          {doc.original_name || doc.filename}
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
          Consulta el estado de esta orden interna de trabajo y gestiona recomendaciones y recursos asociados.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#6b7280", fontSize: 13 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} /> {new Date(doc.created_at).toLocaleString()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={14} /> Estado: {statusLabel}
          </span>
          {pendingGaps > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#b45309", fontWeight: 600 }}>
              <Info size={14} /> {pendingGaps} faltante{pendingGaps === 1 ? "" : "s"} por asignar
            </span>
          )}
          {sampling && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList size={14} /> Muestreo listo
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Button
          variant="secondary"
          onClick={onDownloadBundle}
          disabled={!doc.reference_bundle_available || downloadingBundle}
          loading={downloadingBundle}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Info size={16} /> {downloadingBundle ? "Descargando…" : "Ver README"}
        </Button>
        {samplingDisabled ? (
          <Button
            variant="secondary"
            disabled
            style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "not-allowed" }}
            title={samplingHelper || undefined}
          >
            <ClipboardList size={16} /> Ir a muestreo
          </Button>
        ) : (
          <Link
            to={`/dashboard/oit/${doc.id}/muestreo`}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ClipboardList size={16} /> Ir a muestreo
          </Link>
        )}
        <Button
          variant="secondary"
          onClick={onCheckDocument}
          disabled={checkingDocument}
          loading={checkingDocument}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCcw size={16} /> Verificar IA
        </Button>
        <Button
          variant="primary"
          onClick={onDownloadReport}
          disabled={!sampling || downloading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <FileDown size={16} /> {downloading ? "Generando…" : "Descargar informe"}
        </Button>
      </div>
    </div>
  );
}
