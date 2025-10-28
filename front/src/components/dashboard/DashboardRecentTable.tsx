import React from "react";
import { Link } from "react-router-dom";
import { OitDocumentOut } from "../../services/api";

interface DashboardRecentTableProps {
  items: OitDocumentOut[];
}

export default function DashboardRecentTable({ items }: DashboardRecentTableProps) {
  if (items.length === 0) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #e5e7eb"
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>
          Últimas revisiones
        </h2>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px"
          }}
        >
          No hay documentos aún.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb"
      }}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>
        Últimas revisiones
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              {[
                { label: "Archivo", width: "" },
                { label: "Estado", width: "" },
                { label: "Resumen", width: "300px" },
                { label: "Fecha", width: "" },
                { label: "Acción", width: "" }
              ].map((column) => (
                <th
                  key={column.label}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      width: column.width
                    }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "16px", fontSize: "14px", color: "#111827", fontWeight: "500" }}>
                  {it.original_name || it.filename}
                </td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: it.status === "check" ? "#dcfce7" : "#fef3c7",
                      color: it.status === "check" ? "#166534" : "#92400e"
                    }}
                  >
                    {it.status === "check" ? "Completado" : "Pendiente"}
                  </span>
                </td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280", maxWidth: "300px" }}>
                  {it.summary || "-"}
                </td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                  {new Date(it.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "16px" }}>
                  {it.status === "check" ? (
                    <Link
                      to={`/oit/${it.id}`}
                      style={{
                        padding: "6px 16px",
                        background: "#667eea",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "inline-block"
                      }}
                    >
                      Ver
                    </Link>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
