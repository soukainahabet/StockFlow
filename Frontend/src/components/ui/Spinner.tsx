import { cn } from "@/lib/cn";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-3.5 w-3.5 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

export function Spinner({ size = "md", className }: Props) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        "inline-block animate-spin rounded-full border-default border-t-accent",
        sizes[size],
        className,
      )}
    />
  );
}
