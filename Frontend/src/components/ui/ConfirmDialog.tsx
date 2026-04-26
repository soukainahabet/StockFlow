import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onClose,
  loading,
  destructive = true,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {destructive && (
          <div className="flex-shrink-0 rounded-full bg-red-50 p-2 h-10 w-10 flex items-center justify-center">
            <AlertTriangle className="text-error" size={20} />
          </div>
        )}
        <p className="text-sm text-secondary-700">{message}</p>
      </div>
    </Modal>
  );
}
