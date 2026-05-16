import { api, unwrap } from "./api";
import type {
  ApiResponse,
  InvoiceResponse,
  InvoiceUpdateRequest,
  PageResponse,
} from "@/types";

export interface InvoiceSearchParams {
  q?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const invoicesService = {
  list: (params: InvoiceSearchParams = {}) =>
    unwrap<PageResponse<InvoiceResponse>>(
      api.get<ApiResponse<PageResponse<InvoiceResponse>>>("/api/invoices", {
        params,
      }),
    ),

  getById: (id: number) =>
    unwrap<InvoiceResponse>(
      api.get<ApiResponse<InvoiceResponse>>(`/api/invoices/${id}`),
    ),

  update: (id: number, body: InvoiceUpdateRequest) =>
    unwrap<InvoiceResponse>(
      api.put<ApiResponse<InvoiceResponse>>(`/api/invoices/${id}`, body),
    ),

  /**
   * Streams the server-rendered PDF as a Blob and triggers a download.
   * Falls back gracefully if the response is not a PDF.
   */
  downloadPdf: async (id: number, filename: string) => {
    const response = await api.get<Blob>(`/api/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
