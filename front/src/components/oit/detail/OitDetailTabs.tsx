import React from "react";
import { AlertTriangle, Boxes, Info, ClipboardList, FileSearch, CheckCircle2 } from "lucide-react";

interface OitDetailTabsProps {
  activeTab: "resumen" | "hallazgos" | "plan" | "muestreo" | "analisis" | "resultados";
  onChange: (tab: "resumen" | "hallazgos" | "plan" | "muestreo" | "analisis" | "resultados") => void;
  children: React.ReactNode;
}

const tabs = [
  { key: "resumen", label: "Resumen", icon: Info },
  { key: "hallazgos", label: "Hallazgos", icon: AlertTriangle },
  { key: "plan", label: "Plan", icon: Boxes },
  { key: "muestreo", label: "Muestreo", icon: ClipboardList },
  { key: "analisis", label: "Análisis", icon: FileSearch },
  { key: "resultados", label: "Resultados", icon: CheckCircle2 },
] as const;

export default function OitDetailTabs({ activeTab, onChange, children }: OitDetailTabsProps) {
  return (
    <div className="bg-card border rounded-2xl">
      <div className="flex overflow-x-auto px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key as any)}
              className={"px-4 py-3 inline-flex items-center gap-2 text-sm border-b-2 " + (isActive ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground")}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
