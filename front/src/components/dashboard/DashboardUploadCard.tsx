import React from "react";
import { Upload } from "lucide-react";

interface DashboardUploadCardProps {
  selectedFile: File | null;
  uploading: boolean;
  error: string | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}

export default function DashboardUploadCard({ selectedFile, uploading, error, onFileChange, onUpload }: DashboardUploadCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        marginBottom: "24px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <Upload size={20} color="#667eea" />
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: 0 }}>
          Subir OIT para revisión
        </h2>
      </div>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
        Formato admitido: PDF, TXT, MD
      </p>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          style={{
            padding: "10px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "14px",
            flex: 1
          }}
        />
        <button
          onClick={onUpload}
          disabled={!selectedFile || uploading}
          style={{
            padding: "10px 24px",
            background: uploading || !selectedFile ? "#93c5fd" : "#667eea",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: uploading || !selectedFile ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {uploading ? "Subiendo..." : "Enviar"}
        </button>
      </div>
      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            fontSize: "14px"
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
