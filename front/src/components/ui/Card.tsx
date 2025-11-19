import * as React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-lg border p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}