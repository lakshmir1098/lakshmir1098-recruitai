import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
