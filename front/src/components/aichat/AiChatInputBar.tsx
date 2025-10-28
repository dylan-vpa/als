import React from "react";
import Button from "../ui/Button";

interface AiChatInputBarProps {
  value: string;
  placeholder: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function AiChatInputBar({
  value,
  placeholder,
  loading,
  onChange,
  onSubmit,
  onKeyDown
}: AiChatInputBarProps) {
  return (
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
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={loading}
          loading={loading}
          style={{ borderRadius: 999, padding: "8px 18px" }}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
