export const formatCurrency = (value: number | string | null | undefined): string => {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
};

export const formatNumber = (value: number | string | null | undefined): string => {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR").format(n);
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const debounce = <T extends (...args: never[]) => unknown>(fn: T, delay = 300) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
