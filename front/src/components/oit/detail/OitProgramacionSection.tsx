import React, { useEffect, useMemo, useState } from "react";
import Button from "../../ui/Button";
import { OitDocumentOut, PlanAssignments } from "../../../services/api";

interface OitProgramacionSectionProps {
  doc: OitDocumentOut;
  loading: boolean;
  confirming: boolean;
  onGeneratePlan: (payload: { scheduledDate: string | null; notes: string | null }) => void;
  onConfirmPlan: (approved: boolean, payload: { scheduledDate: string | null; notes: string | null }) => void;
}

export default function OitProgramacionSection({
  doc,
  loading,
  confirming,
  onGeneratePlan,
  onConfirmPlan
}: OitProgramacionSectionProps) {
  const plan = useMemo(() => {
    const value = doc.resource_plan as { assignments?: PlanAssignments[]; scheduled_date?: string | null; notes?: string | null } | null;
    return value ?? { assignments: [], scheduled_date: null, notes: null };
  }, [doc.resource_plan]);

  const gaps = useMemo(() => {
    const raw = doc.resource_gaps as { items?: Array<{ type: string; name?: string | null; quantity: number; status?: string }> } | Array<any> | null;
    if (!raw) return [] as Array<{ type: string; name?: string | null; quantity: number; status?: string }>;
    if (Array.isArray(raw)) return raw as Array<{ type: string; name?: string | null; quantity: number; status?: string }>;
    return raw.items || [];
  }, [doc.resource_gaps]);

  const [scheduledDate, setScheduledDate] = useState<string | "">(plan.scheduled_date || "");
  const [notes, setNotes] = useState<string>(plan.notes || "");

  useEffect(() => {
    setScheduledDate(plan.scheduled_date || "");
    setNotes(plan.notes || "");
  }, [plan.scheduled_date, plan.notes]);

  const handleGenerate = () => {
    onGeneratePlan({
      scheduledDate: scheduledDate ? scheduledDate : null,
      notes: notes.trim() ? notes.trim() : null
    });
  };

  const handleConfirm = (approved: boolean) => {
    onConfirmPlan(approved, {
      scheduledDate: scheduledDate ? scheduledDate : null,
      notes: notes.trim() ? notes.trim() : null
    });
  };

  const statusLabel = useMemo(() => {
    switch (doc.approval_status) {
      case "approved":
        return { label: "Aprobada", color: "#16a34a", background: "#dcfce7" };
      case "needs_revision":
        return { label: "Requiere ajustes", color: "#b45309", background: "#fef3c7" };
      case "pending":
      default:
        return { label: "Pendiente", color: "#0ea5e9", background: "#e0f2fe" };
    }
  }, [doc.approval_status]);

  const assignments = (plan.assignments || []) as PlanAssignments[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: statusLabel.background,
            color: statusLabel.color,
            padding: "6px 12px",
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Estado de programación: {statusLabel.label}
        </span>
        {doc.approved_schedule_date && (
          <span style={{ fontSize: 13, color: "#475569" }}>
            Fecha programada: <strong>{new Date(doc.approved_schedule_date).toLocaleDateString()}</strong>
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, min(100%, 1fr)))" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#475569" }}>
          Fecha tentativa
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
          Notas / Observaciones
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Agrega detalles sobre la programación o ajustes necesarios"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              fontSize: 14,
              resize: "vertical"
            }}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Button
          variant="secondary"
          onClick={handleGenerate}
          loading={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {plan.assignments?.length ? "Recalcular programación" : "Generar programación"}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleConfirm(true)}
          disabled={assignments.length === 0 || confirming}
          loading={confirming}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          Aprobar programación
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

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Asignación de recursos</h3>
        {assignments.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Genera la programación para ver los recursos propuestos y su disponibilidad.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {assignments.map((assignment, index) => (
              <div
                key={index}
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
                  <span style={{ fontSize: 13, color: "#b91c1c" }}>No hay recursos disponibles en el inventario.</span>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {assignment.assignments.map((item) => (
                      <li key={item.id} style={{ fontSize: 13, color: "#475569" }}>
                        <strong>{item.name}</strong> ({item.type}) · Asignados {item.allocated_quantity} de {item.available_quantity}
                        {item.location ? ` · Ubicación: ${item.location}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Faltantes</h3>
        {gaps.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>No hay faltantes registrados.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {gaps.map((gap, idx) => (
              <li key={idx} style={{ fontSize: 13, color: "#b45309" }}>
                <strong>{gap.type}</strong> {gap.name ? `· ${gap.name}` : ""} — faltan {gap.quantity}. {gap.status || ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
