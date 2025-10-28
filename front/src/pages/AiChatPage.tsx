import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button";
import { apiClient } from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { ChevronRight, MessageCircle, Sparkles } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hola, soy tu asistente de OIT. ¿En qué te ayudo?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("llama3.2:3b");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      setLoadingModels(true);
      try {
        const response = await apiClient.getAvailableModels();
        // Si llama3.2:3b está disponible, seleccionarlo por defecto
        if (response.models.includes("llama3.2:3b")) {
          setSelectedModel("llama3.2:3b");
        } else if (response.models.length > 0) {
          setSelectedModel(response.models[0]);
        }
      } catch (e) {
        console.error("Error al cargar modelos:", e);
      } finally {
        setLoadingModels(false);
      }
    }
    fetchModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const placeholderText = useMemo(() => {
    if (loadingModels) return "Cargando asistente...";
    if (loading) return "Esperando respuesta...";
    return "Escribe tu mensaje";
  }, [loadingModels, loading]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setError(null);
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await apiClient.aiChat(text, selectedModel);
      const modelInfo = res.model ? ` (usando modelo: ${res.model})` : "";
      const fallbackInfo = res.used_fallback ? " (usando fallback)" : "";
      setMessages([...next, { 
        role: "assistant", 
        content: res.reply + (modelInfo || fallbackInfo ? `\n\n_${modelInfo}${fallbackInfo}_` : "") 
      }]);
    } catch (e: any) {
      setError(e?.message || "Error enviando mensaje");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) send();
    }
  }

  return (
    <DashboardLayout
      title="Asistente"
      contentStyle={{ padding: "0 40px 32px 40px", overflow: "visible" }}
    >
      <div style={{
        margin: "0 -40px",
        padding: "20px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 82,
        zIndex: 15
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}>
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span>Asistente</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#111827" }}>Asistente inteligente</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Interactúa con el asistente para obtener insights sobre tus OITs y recursos.
          </p>
        </div>
        <div style={{
          background: "#eef2ff",
          border: "1px solid #c7d2fe",
          color: "#4338ca",
          borderRadius: 16,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <Sparkles size={18} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Modelo activo: {selectedModel}</span>
        </div>
      </div>

      <div style={{ padding: "32px 40px 200px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" : "#f3f4f6",
              color: m.role === "user" ? "#ffffff" : "#111827",
              padding: "12px 16px",
              borderRadius: 18,
              maxWidth: "68%",
              boxShadow: m.role === "user" ? "0 16px 30px rgba(37,99,235,0.25)" : "none",
              border: m.role === "assistant" ? "1px solid #e5e7eb" : "none",
              whiteSpace: "pre-wrap",
              fontSize: 14,
              lineHeight: 1.5
            }}
          >
            {m.content}
          </div>
        ))}
        {error && <div className="error" style={{ alignSelf: "center" }}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 32,
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          pointerEvents: "none",
          zIndex: 25
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 38px rgba(15,23,42,0.12)",
            background: "#ffffff",
            width: "min(520px, 90%)",
            pointerEvents: "auto"
          }}
        >
          <input
            className="input"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              padding: "0 10px",
              fontSize: 15
            }}
            placeholder={placeholderText}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button
            variant="primary"
            onClick={send}
            disabled={loading}
            loading={loading}
            style={{ borderRadius: 999, padding: "8px 18px" }}
          >
            Enviar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}