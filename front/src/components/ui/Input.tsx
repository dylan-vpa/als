import * as React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-foreground/80">{label}</label>
      )}
      <input
        className={cn(
          "w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          className
        )}
        {...props}
      />
      {error && (
        <div className="text-destructive text-xs font-medium">{error}</div>
      )}
    </div>
  );
}