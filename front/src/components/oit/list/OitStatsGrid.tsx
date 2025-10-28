import React from "react";
import { LucideIcon } from "lucide-react";

export interface OitStatCard {
  label: string;
  value: number;
  caption: string;
  accent: string;
  icon: LucideIcon;
  badge: string;
  progress: number;
}

interface OitStatsGridProps {
  statCards: OitStatCard[];
}

export default function OitStatsGrid({ statCards }: OitStatsGridProps) {
  return (
    <div className="oit-stats-grid">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.label} className="oit-stats-card">
            <div className="oit-stats-card__info">
              <span className="oit-stats-card__caption">{card.caption}</span>
              <span className="oit-stats-card__value">{card.value}</span>
              <span className="oit-stats-card__label">{card.label}</span>
              <span className="oit-stats-card__badge" style={{ color: card.accent }}>
                {card.badge}
              </span>
            </div>
            <div
              className="oit-stats-card__meter"
              style={{ background: `conic-gradient(${card.accent} ${card.progress}%, #e5e7eb ${card.progress}% 100%)` }}
            >
              <div className="oit-stats-card__meter-inner">
                <IconComponent size={16} color={card.accent} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
