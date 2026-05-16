import type { LabelHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  ref?: Ref<HTMLLabelElement>;
}

export function Label({
  ref,
  className,
  required,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-primary leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
