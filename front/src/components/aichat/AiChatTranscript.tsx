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
    <div className="px-6 md:px-10 pb-36 flex flex-col gap-4">
      {messages.map((m, i) => (
        <div
          key={i}
          className={(m.role === "user" ? "ml-auto" : "mr-auto") + " max-w-[68%] px-4 py-3 rounded-2xl text-sm leading-6 " + (m.role === "user" ? "text-white" : "text-foreground")}
          style={{
            background: m.role === "user" ? "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)" : undefined,
            boxShadow: m.role === "user" ? "0 16px 30px rgba(37,99,235,0.25)" : undefined,
            backgroundColor: m.role === "assistant" ? "#f3f4f6" : undefined
          }}
        >
          {m.content}
        </div>
      ))}
      {error && (
        <div className="mx-auto text-destructive text-sm">
          {error}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
