import React from "react";
import { Link } from "react-router-dom";
import { OitDocumentOut } from "../../../services/api";

interface OitListSectionProps {
  items: OitDocumentOut[];
  loading: boolean;
  error: string | null;
}

export default function OitListSection({ items, loading, error }: OitListSectionProps) {
  let content: React.ReactNode = null;

  if (loading) {
    content = <div className="oit-placeholder">Cargando…</div>;
  } else if (error) {
    content = <div className="error">{error}</div>;
  } else if (items.length === 0) {
    content = <div className="oit-placeholder">No hay OITs cargadas aún.</div>;
  } else {
    content = (
      <div className="oit-list">
        {items.map((i) => {
          const statusClass = `oit-status-badge oit-status-badge--${i.status}`;
          const initials = (i.original_name || i.filename || "").slice(0, 1).toUpperCase();
          return (
            <div key={i.id} className="oit-item">
              <div className="oit-item__meta">
                <div className="oit-item__avatar">{initials || "O"}</div>
                <div className="oit-item__details">
                  <span className="oit-item__title">{i.original_name || i.filename}</span>
                  <span className="oit-item__subtitle">ID #{i.id}</span>
                </div>
              </div>
              <div className="oit-item__date">{new Date(i.created_at).toLocaleString()}</div>
              <div className="oit-item__status">
                <span className={statusClass}>
                  <span className="oit-status-badge__dot" />
                  {i.status === "check" ? "Completada" : i.status === "alerta" ? "Alerta" : "Error"}
                </span>
              </div>
              <div className="oit-item__cta">
                <Link className="btn btn-secondary" to={`/dashboard/oit/${i.id}`}>
                  Ver detalle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="oit-list-wrapper">
      <div className="oit-list-header">
        <div>
          <h2>Listado de OITs</h2>
          <p>Tus documentos más recientes y su estado actual.</p>
        </div>
      </div>
      {content}
    </div>
  );
}
