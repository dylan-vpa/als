import React from "react";
import { RecommendationsResponse } from "../../../services/api";

interface OitRecursosSectionProps {
  canViewRecs: boolean;
  recs: RecommendationsResponse | null;
}

export default function OitRecursosSection({ canViewRecs, recs }: OitRecursosSectionProps) {
  if (!canViewRecs) {
    return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Disponible cuando el estado sea "check" sin alertas ni faltantes.</p>;
  }

  if (!recs) {
    return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Cargando recomendaciones…</p>;
  }

  if ((recs.recommendations || []).length === 0) {
    return <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No se detectaron necesidades adicionales.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, min(100%, 1fr)))", gap: 16, width: "100%" }}>
      {recs.recommendations.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 15,
                color: "#0f172a",
                flex: "1 1 auto",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {item.name}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#6366f1",
                fontWeight: 600,
                flex: "0 0 auto",
                maxWidth: "50%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {item.type}
            </span>
          </div>
          <span style={{ fontSize: 13, color: "#475569" }}>
            Cantidad sugerida: <strong>{item.quantity}</strong>
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#475569",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              overflowWrap: "anywhere"
            }}
          >
            {item.reason}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            Coincidencias: {recs.matches?.[item.type]?.length ? recs.matches[item.type].map((r) => r.name).join(", ") : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
