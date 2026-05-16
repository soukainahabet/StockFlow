import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium rounded-md",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-subtle",
        secondary:
          "bg-surface text-primary border border-default hover:bg-surface-muted hover:border-strong",
        ghost: "text-secondary hover:bg-surface-muted hover:text-primary",
        danger: "bg-danger text-white hover:bg-danger/90 shadow-subtle",
        link: "text-accent underline-offset-4 hover:underline h-auto px-0",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-10 px-4 text-sm",
        "icon-sm": "h-7 w-7",
        icon: "h-9 w-9",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  ref,
  className,
  variant,
  size,
  asChild,
  loading,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  // asChild : on rend EXACTEMENT un seul enfant dans Slot — sinon Radix Slot
  // appelle Children.only(null) et lève une exception (page blanche).
  // Le state `loading` n'a pas de sens sur un Link/asChild, on l'ignore.
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading && (
        <Loader2
          className="h-3.5 w-3.5 animate-spin"
          aria-hidden="true"
          strokeWidth={2.5}
        />
      )}
      {children}
    </button>
  );
}

export { buttonVariants };
