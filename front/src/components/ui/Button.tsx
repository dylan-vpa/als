import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type LegacyVariant = "primary" | "secondary" | "ghost";
type LegacySize = "sm" | "md" | "lg";

function mapVariant(v: LegacyVariant | VariantProps<typeof buttonVariants>["variant"]) {
  if (v === "primary") return "default" as const;
  return v as VariantProps<typeof buttonVariants>["variant"];
}

function mapSize(s: LegacySize | VariantProps<typeof buttonVariants>["size"]) {
  if (s === "md") return "default" as const;
  return s as VariantProps<typeof buttonVariants>["size"];
}

export default function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: LegacyVariant | VariantProps<typeof buttonVariants>["variant"];
  size?: LegacySize | VariantProps<typeof buttonVariants>["size"];
}) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant: mapVariant(variant), size: mapSize(size), className }))}
      {...props}
    >
      {children}
    </button>
  );
}