import type { HTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

interface DivProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function Card({ ref, className, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-default bg-surface shadow-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ ref, className, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1 px-4 py-3 border-b border-default",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  ref,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { ref?: Ref<HTMLHeadingElement> }) {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-sm font-semibold text-primary leading-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  ref,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { ref?: Ref<HTMLParagraphElement> }) {
  return (
    <p ref={ref} className={cn("text-xs text-muted", className)} {...props} />
  );
}

export function CardContent({ ref, className, ...props }: DivProps) {
  return <div ref={ref} className={cn("p-4", className)} {...props} />;
}

export function CardFooter({ ref, className, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center px-4 py-3 border-t border-default",
        className,
      )}
      {...props}
    />
  );
}
