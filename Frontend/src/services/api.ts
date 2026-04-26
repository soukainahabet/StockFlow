import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { tokenStorage } from "@/utils/storage";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let logoutHandler: (() => void) | null = null;
export const registerUnauthorizedHandler = (handler: () => void) => {
  logoutHandler = handler;
};

interface BackendError {
  success?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendError>) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401) {
      tokenStorage.clear();
      if (logoutHandler) logoutHandler();
      toast.error("Session expirée, veuillez vous reconnecter.");
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("Accès refusé : vous n'avez pas les permissions nécessaires.");
      return Promise.reject(error);
    }

    const fieldErrors = payload?.errors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const first = Object.values(fieldErrors)[0];
      if (first) toast.error(String(first));
    } else if (payload?.message) {
      toast.error(payload.message);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  },
);

export const unwrap = async <T>(promise: Promise<{ data: { data: T } }>): Promise<T> => {
  const res = await promise;
  return res.data.data;
};
