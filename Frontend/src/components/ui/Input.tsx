import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  ref,
  className,
  invalid,
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-9 w-full rounded-md border bg-surface px-3 py-1 text-sm text-primary",
        "placeholder:text-muted",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app focus-visible:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",
        invalid
          ? "border-danger focus-visible:border-danger focus-visible:ring-danger/40"
          : "border-default",
        className,
      )}
      {...props}
    />
  );
}
