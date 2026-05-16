import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Camera, ScanLine, X } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./Dialog";
import { Input } from "./Input";
import { Label } from "./Label";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  /** Appelé avec le code détecté (QR, EAN-13, UPC, Code-128, etc.). */
  onScan: (code: string) => void;
  title?: string;
  description?: string;
}

const SUPPORTED_FORMATS = [
  "qr_code",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
] as const;

export function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = "Scanner un code",
  description = "Pointez la caméra sur un code-barres ou un QR code.",
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const handleDetect = useCallback(
    (detected: IDetectedBarcode[]) => {
      const code = detected[0]?.rawValue?.trim();
      if (code) {
        onScan(code);
        setError(null);
      }
    },
    [onScan],
  );

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(
        err.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Autorisez la permission dans votre navigateur."
          : err.name === "NotFoundError"
            ? "Aucune caméra détectée sur ce périphérique."
            : `Erreur caméra : ${err.message}`,
      );
    } else {
      setError("Erreur caméra inconnue.");
    }
  }, []);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (trimmed) {
      onScan(trimmed);
      setManualCode("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          setManualCode("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <ScanLine
              className="h-4 w-4 text-accent"
              aria-hidden="true"
              strokeWidth={2.25}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>

        {/* Caméra */}
        <div className="relative aspect-square bg-slate-950">
          {open && (
            <Scanner
              onScan={handleDetect}
              onError={handleError}
              formats={[...SUPPORTED_FORMATS] as never}
              constraints={{ facingMode: "environment" }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              }}
              components={{
                audio: false,
                finder: false,
                torch: true,
              }}
            />
          )}
          {/* Overlay viseur */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
            )}
          >
            <div className="h-3/5 w-4/5 rounded-md border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
          </div>
          {error && (
            <div className="absolute inset-x-4 bottom-4 rounded-md bg-danger-soft text-danger-soft-fg px-3 py-2 text-xs ring-1 ring-inset ring-danger/20">
              <p className="flex items-start gap-2">
                <Camera className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}
        </div>

        {/* Saisie manuelle (fallback) */}
        <form
          onSubmit={submitManual}
          className="border-t border-default px-5 py-3 space-y-1.5"
        >
          <Label
            htmlFor="manual-barcode"
            className="text-xs text-muted font-normal"
          >
            …ou saisir manuellement
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="manual-barcode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Code-barres ou QR"
              autoComplete="off"
            />
            <Button type="submit" disabled={!manualCode.trim()} size="md">
              Valider
            </Button>
          </div>
        </form>

        <div className="flex justify-end border-t border-default bg-surface-muted/30 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
