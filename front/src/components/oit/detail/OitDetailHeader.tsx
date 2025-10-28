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
  onCheckDocument: () => void;
  onDownloadReport: () => void;
}

export default function OitDetailHeader({
  doc,
  statusLabel,
  sampling,
  checkingDocument,
  downloading,
  onCheckDocument,
  onDownloadReport
}: OitDetailHeaderProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: "20px 24px",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 260px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13, flexWrap: "wrap" }}>
          <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
          <ChevronRight size={14} />
          <Link to="/dashboard/oit" style={{ color: "inherit", textDecoration: "none" }}>OITs</Link>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#6b7280", fontSize: 13 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} /> {new Date(doc.created_at).toLocaleString()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={14} /> Estado: {statusLabel}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end", flex: "1 1 220px", minWidth: 0 }}>
        <Link
          to={`/dashboard/oit/${doc.id}/muestreo`}
          className="btn btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}
        >
          <ClipboardList size={16} /> Ir a muestreo
        </Link>
        <Button
          variant="secondary"
          onClick={onCheckDocument}
          disabled={checkingDocument}
          loading={checkingDocument}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}
        >
          <RefreshCcw size={16} /> Verificar IA
        </Button>
        <Button
          variant="primary"
          onClick={onDownloadReport}
          disabled={!sampling || downloading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}
        >
          <FileDown size={16} /> {downloading ? "Generando…" : "Descargar informe"}
        </Button>
      </div>
    </div>
  );
}
