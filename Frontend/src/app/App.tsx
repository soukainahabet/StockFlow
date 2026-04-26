import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { queryClient } from "./queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0F172A",
                color: "#F8FAFC",
                fontSize: "14px",
                borderRadius: "10px",
                padding: "10px 14px",
              },
              success: { iconTheme: { primary: "#22C55E", secondary: "#0F172A" } },
              error: { iconTheme: { primary: "#EF4444", secondary: "#0F172A" } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
