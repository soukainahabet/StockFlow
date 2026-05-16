import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-secondary ring-default",
        accent: "bg-accent-soft text-accent-soft-fg ring-accent/20",
        success: "bg-success-soft text-success-soft-fg ring-success/20",
        warning: "bg-warning-soft text-warning-soft-fg ring-warning/20",
        danger: "bg-danger-soft text-danger-soft-fg ring-danger/20",
        info: "bg-info-soft text-info-soft-fg ring-info/20",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

const dotColors: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-muted",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

export function Badge({
  ref,
  className,
  variant,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColors[variant ?? "neutral"],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
