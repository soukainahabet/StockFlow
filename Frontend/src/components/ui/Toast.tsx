import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import toast, { Toaster, type ToastOptions } from "react-hot-toast";
import { cn } from "@/lib/cn";

const baseOpts: ToastOptions = {
  duration: 4000,
  style: {
    background: "transparent",
    boxShadow: "none",
    padding: 0,
    margin: 0,
  },
};

interface BodyProps {
  icon: ElementType;
  iconClassName: string;
  title?: ReactNode;
  message: ReactNode;
  onDismiss: () => void;
}

function ToastBody({
  icon: Icon,
  iconClassName,
  title,
  message,
  onDismiss,
}: BodyProps) {
  return (
    <div className="pointer-events-auto flex items-start gap-2.5 rounded-md border border-default bg-surface-elevated px-3 py-2.5 shadow-pop min-w-[280px] max-w-md">
      <Icon
        className={cn("h-4 w-4 mt-0.5 shrink-0", iconClassName)}
        strokeWidth={2.25}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-primary leading-tight">
            {title}
          </p>
        )}
        <div
          className={cn(
            "text-sm text-secondary leading-tight",
            title && "mt-0.5",
          )}
        >
          {message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted hover:text-primary -mr-1 -mt-0.5 p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        aria-label="Fermer"
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ToastInput {
  title?: ReactNode;
  message: ReactNode;
}

function show(
  icon: ElementType,
  iconClassName: string,
  input: ReactNode | ToastInput,
) {
  const { title, message } =
    typeof input === "object" && input !== null && "message" in input
      ? (input as ToastInput)
      : { title: undefined, message: input as ReactNode };
  return toast.custom(
    (t) => (
      <ToastBody
        icon={icon}
        iconClassName={iconClassName}
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    baseOpts,
  );
}

export const toastUI = {
  success: (input: ReactNode | ToastInput) =>
    show(CheckCircle2, "text-success", input),
  error: (input: ReactNode | ToastInput) =>
    show(AlertCircle, "text-danger", input),
  warning: (input: ReactNode | ToastInput) =>
    show(AlertTriangle, "text-warning", input),
  info: (input: ReactNode | ToastInput) => show(Info, "text-info", input),
  dismiss: toast.dismiss,
};

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      containerClassName="!bottom-4 !right-4"
    />
  );
}
