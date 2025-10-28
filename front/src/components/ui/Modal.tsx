import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export default function Modal({ open, title, onClose, children, actions }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ fontWeight: 700 }}>{title || "Modal"}</div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "none", padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {actions && (
          <div className="modal-footer">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}