import clsx from "clsx";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: Props) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={clsx(
        "inline-block animate-spin rounded-full border-secondary-200 border-t-primary",
        sizes[size],
        className,
      )}
    />
  );
}
