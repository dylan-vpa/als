import React, { useEffect, useMemo, useState } from "react";
import Button from "../../ui/Button";
import { OitDocumentOut, PlanAssignments, RecommendationsResponse } from "../../../services/api";

interface OitPlanSectionProps {
  doc: OitDocumentOut;
  recs: RecommendationsResponse | null;
  canViewPlan: boolean;
  loading: boolean;
  confirming: boolean;
  onGeneratePlan: (payload: { scheduledDatetime: string | null; notes: string | null }) => void;
  onConfirmPlan: (approved: boolean, payload: { scheduledDatetime: string | null; notes: string | null }) => void;
}

type PlanData = {
  assignments?: PlanAssignments[];
  scheduled_datetime?: string | null;
  notes?: string | null;
  ai_schedule?: {
    suggested_date?: string | null;
    suggested_time?: string | null;
    justification?: string | null;
  } | null;
};

type GapItem = { type: string; name?: string | null; quantity: number; status?: string };

export default function OitPlanSection({
  doc,
  recs,
  canViewPlan,
  loading,
  confirming,
  onGeneratePlan,
  onConfirmPlan
}: OitPlanSectionProps) {
  if (!canViewPlan) {
    return (
      <div style={{ fontSize: 13, color: "#6b7280" }}>
        Disponible cuando el estado sea "check" sin alertas ni faltantes.
      </div>
    );
  }

  const plan = useMemo<PlanData>(() => {
    const raw = (doc.resource_plan as PlanData | null) ?? undefined;
    return raw ?? { assignments: [], scheduled_datetime: null, notes: null, ai_schedule: null };
  }, [doc.resource_plan]);

  const gaps = useMemo<GapItem[]>(() => {
    const raw = doc.resource_gaps as { items?: GapItem[] } | GapItem[] | null;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.items || [];
  }, [doc.resource_gaps]);

  const aiSchedule = useMemo(() => {
    if (plan?.ai_schedule) return plan.ai_schedule;
    return recs?.schedule ?? null;
  }, [plan?.ai_schedule, recs?.schedule]);

  const deriveDatePart = (value?: string | null) => {
    if (!value) return "";
    const date = value.split("T")[0];
    return date || "";
  };

  const deriveTimePart = (value?: string | null) => {
    if (!value) return "";
    const [, time] = value.split("T");
    if (!time) return "";
    return time.slice(0, 5);
  };

  const initialScheduledSource = plan.scheduled_datetime || doc.approved_schedule_date || null;

  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    if (initialScheduledSource) return deriveDatePart(initialScheduledSource);
    if (aiSchedule?.suggested_date) return aiSchedule.suggested_date;
    return "";
  });

  const [scheduledTime, setScheduledTime] = useState<string>(() => {
    if (initialScheduledSource) return deriveTimePart(initialScheduledSource) || "09:00";
    if (aiSchedule?.suggested_time) return aiSchedule.suggested_time;
    return "09:00";
  });

  const [notes, setNotes] = useState<string>(() => plan.notes ?? doc.approval_notes ?? "");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    const source = plan.scheduled_datetime || doc.approved_schedule_date || null;
    if (source) {
      setScheduledDate(deriveDatePart(source));
      setScheduledTime(deriveTimePart(source) || "09:00");
      return;
    }
    if (aiSchedule) {
      setScheduledDate(aiSchedule.suggested_date || "");
      setScheduledTime(aiSchedule.suggested_time || "09:00");
    }
  }, [plan.scheduled_datetime, doc.approved_schedule_date, aiSchedule]);

  useEffect(() => {
    setNotes(plan.notes ?? doc.approval_notes ?? "");
  }, [plan.notes, doc.approval_notes]);

  const assignments = (plan.assignments || []) as PlanAssignments[];
  const recommended = recs?.recommendations || [];
  const matches = recs?.matches || {};
  const pendingGapCount = doc.pending_gap_count ?? gaps.filter((gap) => (gap?.quantity ?? 0) > 0).length;

  const combineDateTime = (date: string, time: string) => {
    if (!date) return null;
    const hour = time && time.trim() ? time : "09:00";
    return `${date}T${hour}`;
  };

  const handleGenerate = () => {
    setFeedbackError(null);
    onGeneratePlan({
      scheduledDatetime: combineDateTime(scheduledDate, scheduledTime),
      notes: notes.trim() ? notes.trim() : null
    });
  };

  const handleConfirm = (approved: boolean) => {
    if (approved && pendingGapCount > 0) {
      setFeedbackError("No puedes aprobar mientras existan recursos faltantes.");
      return;
    }
    if (!approved && !notes.trim()) {
      setFeedbackError("Agrega notas para que la IA entienda los ajustes necesarios.");
      return;
    }
    setFeedbackError(null);
    onConfirmPlan(approved, {
      scheduledDatetime: combineDateTime(scheduledDate, scheduledTime),
      notes: notes.trim() ? notes.trim() : null
    });
  };

  const applyAiSuggestion = () => {
    if (!aiSchedule) return;
    if (aiSchedule.suggested_date) setScheduledDate(aiSchedule.suggested_date);
    if (aiSchedule.suggested_time) setScheduledTime(aiSchedule.suggested_time);
  };

  const currentSchedule = plan.scheduled_datetime || doc.approved_schedule_date || null;

  const renderTag = (label: string, color: string, background: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        color,
        background
      }}
    >
      {label}
    </span>
  );

  const statusChip = (() => {
    switch (doc.approval_status) {
      case "approved":
        return renderTag("Aprobada", "#166534", "#dcfce7");
      case "needs_revision":
        return renderTag("Requiere ajustes", "#92400e", "#fef3c7");
      default:
        return renderTag("Pendiente", "#0ea5e9", "#e0f2fe");
    }
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {statusChip}
          {currentSchedule ? (
            <span style={{ fontSize: 13, color: "#475569" }}>
              Programado para: <strong>{new Date(currentSchedule).toLocaleString()}</strong>
            </span>
          ) : (
            <span style={{ fontSize: 13, color: "#475569" }}>Sin programación confirmada.</span>
          )}
          {pendingGapCount > 0 && renderTag(`${pendingGapCount} faltante${pendingGapCount === 1 ? "" : "s"}`, "#b45309", "#fef3c7")}
        </div>
        {aiSchedule && (
          <div
            style={{
              border: "1px solid #c7d2fe",
              background: "#eef2ff",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4338ca" }}>Sugerencia IA</span>
            <span style={{ fontSize: 13, color: "#312e81" }}>
              Fecha sugerida: <strong>{aiSchedule.suggested_date || "—"}</strong> · Hora sugerida: <strong>{aiSchedule.suggested_time || "—"}</strong>
            </span>
            {aiSchedule.justification && (
              <span style={{ fontSize: 12, color: "#4338ca" }}>{aiSchedule.justification}</span>
            )}
            <Button
              variant="ghost"
              onClick={applyAiSuggestion}
              style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12 }}
            >
              Usar sugerencia
            </Button>
          </div>
        )}
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, min(100%, 1fr)))" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#475569" }}>
          Fecha programada
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 14
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#475569" }}>
          Hora programada
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 14
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#475569" }}>
          Notas / Retroalimentación
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe ajustes, restricciones o feedback para la IA"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              fontSize: 14,
              resize: "vertical"
            }}
          />
        </label>
      </section>

      {feedbackError && (
        <div style={{ fontSize: 12, color: "#b91c1c" }}>{feedbackError}</div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Button
          variant="secondary"
          onClick={handleGenerate}
          loading={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {assignments.length ? "Recalcular plan" : "Generar plan"}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleConfirm(true)}
          disabled={assignments.length === 0 || confirming || pendingGapCount > 0}
          loading={confirming}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          Aprobar plan
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleConfirm(false)}
          disabled={confirming}
          loading={confirming}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          Solicitar ajustes
        </Button>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Recursos sugeridos por la IA</h3>
        {!recs ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Cargando recomendaciones…</p>
        ) : recommended.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No se detectaron necesidades adicionales.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, min(100%, 1fr)))", gap: 16 }}>
            {recommended.map((item, index) => {
              const inventoryMatches = (matches[item.type] || []).filter((match) => match && match.name);
              const hasExactMatch = inventoryMatches.some(
                (match) => match.name && item.name && match.name.toLowerCase() === item.name.toLowerCase()
              );
              const matchNames = inventoryMatches.map((match) => match.name).filter(Boolean).join(", ");
              return (
                <div
                  key={`${item.type}-${item.name}-${index}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{item.name}</span>
                    {hasExactMatch
                      ? renderTag("En inventario", "#166534", "#dcfce7")
                      : renderTag("Fuera de inventario", "#92400e", "#fef3c7")}
                  </div>
                  <span style={{ fontSize: 12, color: "#6366f1", textTransform: "uppercase", fontWeight: 600 }}>{item.type}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    Cantidad sugerida: <strong>{item.quantity}</strong>
                  </span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{item.reason}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Coincidencias en base de datos: {matchNames || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Asignación de recursos</h3>
        {assignments.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Genera el plan para ver los recursos asignados automáticamente.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {assignments.map((assignment, index) => (
              <div
                key={`${assignment.request.type}-${assignment.request.name}-${index}`}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                    {assignment.request.type} {assignment.request.name ? `· ${assignment.request.name}` : ""}
                  </div>
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    Requeridos: <strong>{assignment.request.quantity}</strong> · Cumplidos: <strong>{assignment.fulfilled_quantity}</strong>
                  </div>
                </div>
                {assignment.assignments.length === 0 ? (
                  <span style={{ fontSize: 13, color: "#b91c1c" }}>No hay recursos disponibles en inventario.</span>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {assignment.assignments.map((item) => (
                      <li key={item.id} style={{ fontSize: 13, color: "#475569", display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span>
                          <strong>{item.name}</strong> ({item.type}) · Asignados {item.allocated_quantity} de {item.available_quantity}
                          {item.location ? ` · Ubicación: ${item.location}` : ""}
                        </span>
                        {item.available
                          ? renderTag("En inventario", "#166534", "#dcfce7")
                          : renderTag("No disponible", "#92400e", "#fef3c7")}
                      </li>)
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Faltantes</h3>
        {gaps.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No hay faltantes registrados.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {gaps.map((gap, idx) => (
              <li key={`${gap.type}-${gap.name}-${idx}`} style={{ fontSize: 13, color: "#b45309" }}>
                <strong>{gap.type}</strong> {gap.name ? `· ${gap.name}` : ""} — faltan {gap.quantity}. {gap.status || ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
