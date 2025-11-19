import React from "react";
import Button from "../ui/Button";
import { Send } from "lucide-react";

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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-30 w-full max-w-3xl px-4">
      <div className="rounded-full border bg-card shadow-xl w-full overflow-hidden">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 h-11 px-4 bg-transparent outline-none border-none text-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button
            aria-label="Enviar"
            variant="primary"
            onClick={onSubmit}
            disabled={loading}
            loading={loading}
            className="h-11 px-4 rounded-none"
          >
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
