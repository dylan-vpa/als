import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface DashboardStatCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

interface DashboardStatsGridProps {
  stats: DashboardStatCard[];
}

export default function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "32px"
      }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

        return (
          <div
            key={`${stat.label}-${index}`}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `${stat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon size={24} color={stat.color} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  background: stat.trend === "up" ? "#dcfce7" : "#fee2e2",
                  color: stat.trend === "up" ? "#166534" : "#991b1b",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                <TrendIcon size={14} />
                {stat.change}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
