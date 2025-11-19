import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Inbox, History, BellRing } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/ui/Button";
import { useNotifications } from "../contexts/NotificationsContext";

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
}

export default function AlertsPage() {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();

  const grouped = useMemo(() => {
    const unread = notifications.filter((item) => !item.read_at);
    const read = notifications.filter((item) => item.read_at);
    return { unread, read };
  }, [notifications]);

  const statsCards = useMemo(
    () => [
      {
        label: "Alertas nuevas",
        value: unreadCount,
        caption: "Pendientes de revisar",
        accent: "#ef4444",
        icon: AlertTriangle,
      },
      {
        label: "Historial",
        value: notifications.length,
        caption: "Alertas totales registradas",
        accent: "#0ea5e9",
        icon: History,
      },
      {
        label: "Acciones recientes",
        value: grouped.read.slice(0, 3).length,
        caption: grouped.read.length ? "Últimas 3 marcadas como leídas" : "Aún sin historial",
        accent: "#16a34a",
        icon: CheckCircle2,
      },
    ],
    [grouped.read, notifications.length, unreadCount]
  );

  async function handleMarkAll() {
    if (!notifications.length || !unreadCount) return;
    await markAsRead();
  }

  async function handleMarkSingle(id: number) {
    await markAsRead([id]);
  }

  const actions = (
    <Button type="button" variant="secondary" disabled={!notifications.length || !unreadCount} onClick={handleMarkAll} className="inline-flex items-center gap-2">
      <CheckCircle2 size={16} /> Marcar todas como leídas
    </Button>
  );

  const renderNotificationCard = (
    item: typeof notifications[number],
    options: { tone: "pending" | "muted" }
  ) => {
    const isPending = options.tone === "pending";
    const accent = isPending ? "#fef2f2" : "#f8fafc";
    const border = isPending ? "#fecaca" : "#e2e8f0";
    const iconColor = isPending ? "#b91c1c" : "#475569";
    const Icon = isPending ? BellRing : Inbox;

    return (
      <article
        key={item.id}
        style={{
          border: `1px solid ${border}`,
          background: accent,
          borderRadius: 18,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
        }}
      >
        <header style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${iconColor}15`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={iconColor} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, color: isPending ? "#9f1239" : "#0f172a" }}>{item.title}</h3>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: isPending ? "#fee2e2" : "#e2e8f0",
                  color: isPending ? "#991b1b" : "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {item.type?.replace("oit.", "").split("_").join(" ") || "notificación"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: isPending ? "#7f1d1d" : "#475569", lineHeight: 1.6 }}>
              {item.message}
            </p>
          </div>
        </header>

        <footer
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            color: isPending ? "#7f1d1d" : "#475569",
            fontSize: 13,
          }}
        >
          <span>{formatDate(item.created_at)}</span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {item.document_id && (
              <Link className="btn btn-secondary btn-sm" to={`/dashboard/oit/${item.document_id}`}>
                Ver OIT #{item.document_id}
              </Link>
            )}
            {isPending && (
              <Button type="button" size="sm" variant="ghost" onClick={() => handleMarkSingle(item.id)}>
                Marcar leído
              </Button>
            )}
          </div>
        </footer>
      </article>
    );
  };

  return (
    <DashboardLayout title="Alertas" actions={actions}>
      <div className="flex flex-col gap-7">
        <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-card border rounded-xl p-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md inline-flex items-center justify-center" style={{ background: `${card.accent}22` }}>
                  <card.icon size={18} color={card.accent} />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</span>
              </div>
              <strong className="text-2xl text-foreground leading-none">{card.value}</strong>
              <span className="text-sm text-muted-foreground">{card.caption}</span>
            </div>
          ))}
        </section>

        {loading && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: 24,
              color: "#67748b",
              fontSize: 14,
            }}
          >
            Cargando notificaciones…
          </div>
        )}

        {!notifications.length && !loading ? (
          <div className="bg-muted/30 border rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
            <div
              className="w-18 h-18 rounded-xl bg-sky-100 flex items-center justify-center"
            >
              <BellRing size={32} color="#0284c7" />
            </div>
            <h2 className="m-0 text-xl text-foreground">Sin alertas por ahora</h2>
            <p className="m-0 text-sm max-w-sm">
              Cuando la IA valide documentos o se registren eventos de programación, recibirás aquí los avisos
              importantes para dar seguimiento inmediato.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {grouped.unread.length > 0 && (
              <section className="flex flex-col gap-4">
                <header className="flex items-center justify-between">
                  <h2 className="m-0 text-base text-foreground">Pendientes</h2>
                  <span className="text-red-700 font-semibold">{unreadCount} sin revisar</span>
                </header>
                <div className="grid gap-4">
                  {grouped.unread.map((item) => renderNotificationCard(item, { tone: "pending" }))}
                </div>
              </section>
            )}

            {grouped.read.length > 0 && (
              <section className="flex flex-col gap-4">
                <header className="flex items-center justify-between">
                  <h2 className="m-0 text-base text-foreground">Historial</h2>
                  <span className="text-muted-foreground text-xs">
                    Última actividad {formatDate(grouped.read[0].read_at || grouped.read[0].created_at)}
                  </span>
                </header>
                <div className="grid gap-4">
                  {grouped.read.map((item) => renderNotificationCard(item, { tone: "muted" }))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
