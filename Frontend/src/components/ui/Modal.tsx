import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className={clsx(
          "relative w-full rounded-2xl bg-card shadow-2xl border border-secondary-100",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-secondary-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-secondary-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-secondary-100 px-6 py-4 bg-secondary-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
