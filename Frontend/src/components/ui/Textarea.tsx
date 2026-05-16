import type { Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ ref, className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border bg-surface px-3 py-2 text-sm text-primary",
        "placeholder:text-muted",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app focus-visible:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-danger focus-visible:border-danger focus-visible:ring-danger/40"
          : "border-default",
        className,
      )}
      {...props}
    />
  );
}
