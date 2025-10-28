import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient, OitDocumentOut } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { TrendingUp, TrendingDown, FileText, CheckCircle, Clock, Upload } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OitDocumentOut[]>([]);

  async function loadList() {
    try {
      const list = await apiClient.listOit();
      setItems(list);
    } catch (err: any) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function onUpload() {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    try {
      const res = await apiClient.uploadOit(selectedFile);
      setItems((prev) => [res, ...prev]);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err?.message || "Error al subir OIT");
    } finally {
      setUploading(false);
    }
  }

  const stats = [
    {
      label: "Total OITs",
      value: items.length.toString(),
      change: "+12.5%",
      trend: "up",
      icon: FileText,
      color: "#667eea"
    },
    {
      label: "Completadas",
      value: items.filter(i => i.status === "check").length.toString(),
      change: "+8.2%",
      trend: "up",
      icon: CheckCircle,
      color: "#10b981"
    },
    {
      label: "En Proceso",
      value: items.filter(i => i.status !== "check").length.toString(),
      change: "-3.1%",
      trend: "down",
      icon: Clock,
      color: "#f59e0b"
    }
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>Panel general</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Bienvenido{user ? `, ${user.full_name || user.email}` : ""}. Revisa el estado de tus OITs y actividades recientes.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "32px"
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #e5e7eb",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `${stat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon size={24} color={stat.color} />
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  background: stat.trend === "up" ? "#dcfce7" : "#fee2e2",
                  color: stat.trend === "up" ? "#166534" : "#991b1b",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  <TrendIcon size={14} />
                  {stat.change}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Card */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        marginBottom: "24px"
      }}>
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
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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
          <div style={{
            marginTop: "12px",
            padding: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Recent OITs Table */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>
          Últimas revisiones
        </h2>
        {items.length === 0 ? (
          <div style={{ 
            padding: "40px", 
            textAlign: "center", 
            color: "#6b7280",
            fontSize: "14px"
          }}>
            No hay documentos aún.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ 
                    textAlign: "left", 
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase"
                  }}>Archivo</th>
                  <th style={{ 
                    textAlign: "left", 
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase"
                  }}>Estado</th>
                  <th style={{ 
                    textAlign: "left", 
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase"
                  }}>Resumen</th>
                  <th style={{ 
                    textAlign: "left", 
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase"
                  }}>Fecha</th>
                  <th style={{ 
                    textAlign: "left", 
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase"
                  }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#111827", fontWeight: "500" }}>
                      {it.original_name || it.filename}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: it.status === "check" ? "#dcfce7" : "#fef3c7",
                        color: it.status === "check" ? "#166534" : "#92400e"
                      }}>
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
        )}
      </div>
    </DashboardLayout>
  );
}