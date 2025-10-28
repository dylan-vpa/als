import React from "react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AiChatTranscriptProps {
  messages: ChatMsg[];
  error: string | null;
  endRef: React.RefObject<HTMLDivElement | null>;
}

export default function AiChatTranscript({ messages, error, endRef }: AiChatTranscriptProps) {
  return (
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
      {error && (
        <div className="error" style={{ alignSelf: "center" }}>
          {error}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
