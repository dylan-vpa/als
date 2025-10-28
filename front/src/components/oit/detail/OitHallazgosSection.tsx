import React from "react";

interface OitHallazgosSectionProps {
  alerts: string[];
  missing: string[];
  evidence: string[];
}

export default function OitHallazgosSection({ alerts, missing, evidence }: OitHallazgosSectionProps) {
  const sections = [
    { title: "Alertas", list: alerts },
    { title: "Faltantes", list: missing },
    { title: "Evidencias", list: evidence }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, min(100%, 1fr)))", gap: 16 }}>
      {sections.map((section) => (
        <div key={section.title} style={{ background: "#f8fafc", borderRadius: 18, padding: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{section.title}</h3>
          {section.list.length === 0 ? (
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#6b7280" }}>Sin registros.</p>
          ) : (
            <ul
              style={{
                margin: "12px 0 0 18px",
                color: "#374151",
                fontSize: 13,
                lineHeight: 1.5,
                wordBreak: "break-word"
              }}
            >
              {section.list.map((item, idx) => (
                <li key={`${section.title}-${idx}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
