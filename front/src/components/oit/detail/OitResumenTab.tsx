import React from "react";
import { OitDocumentOut } from "../../../services/api";

interface SummaryBlock {
  label: string;
  value: string;
  badge?: boolean;
}

interface OitResumenTabProps {
  doc: OitDocumentOut;
  statusColor: string;
  statusLabel: string;
}

export default function OitResumenTab({ doc, statusColor, statusLabel }: OitResumenTabProps) {
  const summaryBlocks: SummaryBlock[] = [
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 15, color: "#4b5563", overflowWrap: "anywhere" }}>
        {doc.summary || "Sin resumen disponible."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, min(100%, 1fr)))", gap: 16 }}>
        {summaryBlocks.map((block) => (
          <div key={block.label} style={{ background: "#f8fafc", borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{block.label}</div>
            {block.badge ? (
              <span
                style={{
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
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
                {block.value}
              </span>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  fontWeight: 600,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                  maxWidth: "100%"
                }}
              >
                {block.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
