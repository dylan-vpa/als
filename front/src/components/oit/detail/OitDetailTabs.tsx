import React from "react";
import { AlertTriangle, Boxes, Info } from "lucide-react";

interface OitDetailTabsProps {
  activeTab: "resumen" | "hallazgos" | "plan";
  onChange: (tab: "resumen" | "hallazgos" | "plan") => void;
  children: React.ReactNode;
}

const tabs = [
  { key: "resumen", label: "Resumen", icon: Info },
  { key: "hallazgos", label: "Hallazgos", icon: AlertTriangle },
  { key: "plan", label: "Plan", icon: Boxes },
] as const;

export default function OitDetailTabs({ activeTab, onChange, children }: OitDetailTabsProps) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 24 }}>
      <div style={{ display: "flex", overflowX: "auto", padding: "0 12px" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              style={{
                border: "none",
                background: "none",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#1d4ed8" : "#6b7280",
                borderBottom: isActive ? "3px solid #1d4ed8" : "3px solid transparent",
                cursor: "pointer"
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}
