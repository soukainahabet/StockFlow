import { cn } from "@/lib/cn";

/**
 * StockFlow brand mark. The source PNG lives in {@code /public/StockFlowLogo.png}
 * so the same asset can power both the favicon and React component usage without duplication.
 *
 * The image has a white background and a colorful mark/wordmark.
 * Wrapping it in {@code rounded-md} produces a clean rounded white tile that reads well
 * on both light and dark surfaces — no theme-specific variant required.
 */
type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  alt?: string;
}

const SIZE_CLASS: Record<LogoSize, string> = {
  sm: "h-7 w-7",     // sidebar collapsed
  md: "h-9 w-9",     // sidebar expanded, header chips
  lg: "h-16 w-16",   // small auth panels
  xl: "h-24 w-24",   // login / register hero
};

export function Logo({ size = "md", className, alt = "StockFlow" }: LogoProps) {
  return (
    <img
      src="/StockFlowLogo.png"
      alt={alt}
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      className={cn(
        "shrink-0 rounded-md bg-white object-contain",
        "shadow-sm ring-1 ring-black/5",
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}
