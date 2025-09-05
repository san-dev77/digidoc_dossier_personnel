"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useConnectionError } from "@/contexts/ConnectionErrorContext";
import ClientOnly from "./ClientOnly";
import ConnectionErrorPage from "./ConnectionErrorPage";
import ReconnectModal from "./ReconnectModal";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: AuthGuardProps) {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Chargement...</p>
          </div>
        </div>
      }
    >
      <AuthGuardContent requireAuth={requireAuth} redirectTo={redirectTo}>
        {children}
      </AuthGuardContent>
    </ClientOnly>
  );
}

function AuthGuardContent({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const { connectionError, isRetrying, retryConnection } = useConnectionError();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router]);

  // Si il y a une erreur de connexion, afficher la page d'erreur
  if (connectionError && connectionError.retryCount >= 0) {
    return (
      <ConnectionErrorPage
        error={connectionError}
        onRetry={retryConnection}
        isRetrying={isRetrying}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>

        {/* Modal de reconnexion pour les premières tentatives */}
        {connectionError && connectionError.retryCount < 1 && (
          <ReconnectModal
            isOpen={true}
            onClose={() => {}}
            onRetry={retryConnection}
            isRetrying={isRetrying}
            retryCount={connectionError.retryCount}
          />
        )}
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
