import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export default function Modal({ open, title, onClose, children, actions }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{title || "Modal"}</div>
            <DialogPrimitive.Close className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </DialogPrimitive.Close>
          </div>
          <div>{children}</div>
          {actions && (
            <div className="flex sm:justify-end sm:space-x-2 flex-col-reverse sm:flex-row">
              {actions}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}