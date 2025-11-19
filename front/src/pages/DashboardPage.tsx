import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient, OitDocumentOut } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { FileText, CheckCircle, Clock } from "lucide-react";
import DashboardHeaderSection from "../components/dashboard/DashboardHeaderSection";
import DashboardStatsGrid, { DashboardStatCard } from "../components/dashboard/DashboardStatsGrid";
import DashboardUploadCard from "../components/dashboard/DashboardUploadCard";
import DashboardRecentTable from "../components/dashboard/DashboardRecentTable";

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

  const stats: DashboardStatCard[] = useMemo(() => {
    const completed = items.filter((i) => i.status === "check").length;
    const pending = items.length - completed;
    return [
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
        value: completed.toString(),
        change: "+8.2%",
        trend: "up",
        icon: CheckCircle,
        color: "#10b981"
      },
      {
        label: "En Proceso",
        value: pending.toString(),
        change: "-3.1%",
        trend: "down",
        icon: Clock,
        color: "#f59e0b"
      }
    ];
  }, [items]);

  const recentItems = useMemo(() => items.slice(0, 10), [items]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid gap-6">
        <DashboardHeaderSection greetingName={user ? user.full_name || user.email : undefined} />
        <DashboardStatsGrid stats={stats} />
        <div className="grid gap-6 md:grid-cols-2">
          <DashboardUploadCard
            selectedFile={selectedFile}
            uploading={uploading}
            error={error}
            onFileChange={setSelectedFile}
            onUpload={onUpload}
          />
          <div className="bg-card border rounded-xl p-4">
            <DashboardRecentTable items={recentItems} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}