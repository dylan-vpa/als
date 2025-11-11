import React from "react";
import { OitDocumentOut } from "../../../services/api";

interface OitDetailSummarySectionProps {
  doc: OitDocumentOut;
  statusColor: string;
  statusLabel: string;
}

export default function OitDetailSummarySection({ doc, statusColor, statusLabel }: OitDetailSummarySectionProps) {
  const showReviewNotes = !!doc.review_notes?.trim();
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: "20px 24px",
        display: "grid",
        gap: 20,
        gridTemplateColumns: showReviewNotes ? "minmax(260px, 1.1fr) minmax(200px, 1fr)" : "repeat(auto-fit, minmax(240px, min(100%, 1fr)))"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Resumen</span>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          Estado general
        </h2>
        <p style={{ margin: 0, color: "#374151", lineHeight: 1.6, overflowWrap: "anywhere" }}>{doc.summary || "Sin resumen disponible."}</p>
        {showReviewNotes && (
          <div
            style={{
              marginTop: 8,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "#0369a1", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Notas del análisis IA
            </span>
            <p style={{ margin: 0, color: "#075985", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>{doc.review_notes}</p>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, min(100%, 1fr)))", gap: 16 }}>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Archivo</span>
          <div
            style={{
              marginTop: 6,
              fontWeight: 600,
              color: "#0f172a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0
            }}
          >
            {doc.original_name || doc.filename}
          </div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Creado</span>
          <div style={{ marginTop: 6, fontWeight: 600, color: "#0f172a" }}>{new Date(doc.created_at).toLocaleDateString()}</div>
        </div>
        <div style={{ background: "#eff6ff", borderRadius: 16, padding: 16, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.6 }}>Estado</span>
          <div style={{ marginTop: 6 }}>
            <span
              className="badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: `${statusColor}1a`,
                color: statusColor,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
