import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { MessageCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { apiClient } from "../services/api";
import AiChatHeader from "../components/aichat/AiChatHeader";
import AiChatTranscript from "../components/aichat/AiChatTranscript";
import AiChatInputBar from "../components/aichat/AiChatInputBar";

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
      const fallbackNote = res.used_fallback ? "\n\n_(usando fallback)_" : "";
      setMessages([...next, {
        role: "assistant",
        content: res.reply + fallbackNote
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
      <AiChatHeader selectedModel={selectedModel} />

      <AiChatTranscript messages={messages} error={error} endRef={messagesEndRef} />

      <AiChatInputBar
        value={input}
        placeholder={placeholderText}
        loading={loading}
        onChange={setInput}
        onSubmit={send}
        onKeyDown={onKeyDown}
      />
    </DashboardLayout>
  );
}