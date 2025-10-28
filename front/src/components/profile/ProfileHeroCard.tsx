import React from "react";
import Card from "../ui/Card";

interface ProfileHeroCardProps {
  fullName: string;
  email: string;
  badges?: string[];
}

export default function ProfileHeroCard({ fullName, email, badges = [] }: ProfileHeroCardProps) {
  const initial = (fullName || email || "?").charAt(0).toUpperCase();

  return (
    <Card>
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
          borderRadius: 22,
          padding: 32,
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
          color: "#ffffff"
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 26,
            background: "rgba(255,255,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 700
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{fullName || "Usuario sin nombre"}</h2>
          <p style={{ margin: "8px 0 0 0", opacity: 0.88 }}>{email}</p>
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              {badges.map((badge) => (
                <span
                  key={badge}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
