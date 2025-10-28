import React, { useRef } from "react";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import { UploadCloud, Paperclip, Trash2 } from "lucide-react";

interface OitUploadModalProps {
  open: boolean;
  uploading: boolean;
  uploadError: string | null;
  file: File | null;
  isDragging: boolean;
  onClose: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void | Promise<void>;
}

export default function OitUploadModal({
  open,
  uploading,
  uploadError,
  file,
  isDragging,
  onClose,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onUpload
}: OitUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Modal
      open={open}
      title="Subir nueva OIT"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onUpload} loading={uploading} disabled={!file}>
            Subir OIT
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#1d4ed8" : "#cbd5f5"}`,
            background: isDragging ? "#eef2ff" : "#f8fafc",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadCloud size={26} color="white" />
            </div>
            <div style={{ fontWeight: 600, color: "#1e3a8a", fontSize: 16 }}>Arrastra tu archivo aquí</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>o haz clic para seleccionarlo. Se admiten formatos PDF, TXT y MD.</div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />

        {file && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "#f1f5f9",
              borderRadius: 12,
              padding: "12px 16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Paperclip size={18} color="#1e293b" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{Math.ceil(file.size / 1024)} KB</div>
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => onFileSelect(null)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Trash2 size={16} /> Quitar
            </button>
          </div>
        )}

        {uploadError && (
          <div className="error" style={{ marginTop: 4 }}>
            {uploadError}
          </div>
        )}
      </div>
    </Modal>
  );
}
