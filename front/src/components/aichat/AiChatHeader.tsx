import React from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import * as Select from "@radix-ui/react-select";

interface AiChatHeaderProps {
  selectedModel: string;
  models?: string[];
  onChangeModel?: (value: string) => void;
}

export default function AiChatHeader({ selectedModel, models = [], onChangeModel }: AiChatHeaderProps) {
  return (
    <div className="bg-card border-b px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-5 mb-6">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Asistente</span>
        </div>
        <h1 className="m-0 text-2xl font-bold text-foreground truncate">Asistente inteligente</h1>
        <p className="m-0 text-sm text-muted-foreground">Interactúa con el asistente para obtener insights sobre tus OITs y recursos.</p>
      </div>
      <div className="inline-flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border bg-indigo-50 text-indigo-700 px-4 py-2">
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Modelo</span>
        </div>
        {models.length > 0 ? (
          <Select.Root value={selectedModel} onValueChange={(v) => onChangeModel?.(v)}>
            <Select.Trigger className="inline-flex h-9 items-center justify-between rounded-md border bg-background px-3 text-sm w-[200px]">
              <Select.Value />
            </Select.Trigger>
            <Select.Content className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md">
              <Select.Viewport className="p-1">
                {models.map((m) => (
                  <Select.Item key={m} value={m} className="px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-accent/40">
                    <Select.ItemText>{m}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Root>
        ) : (
          <span className="text-sm text-muted-foreground">{selectedModel}</span>
        )}
      </div>
    </div>
  );
}
