"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ClientOnly from "./ClientOnly";

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
  const { isAuthenticated, loading, appUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const mustChangePassword = !!appUser?.mustChangePassword;

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push("/dashboard");
      } else if (
        isAuthenticated &&
        mustChangePassword &&
        pathname !== "/changer-mot-de-passe"
      ) {
        router.push("/changer-mot-de-passe");
      }
    }
  }, [
    isAuthenticated,
    loading,
    requireAuth,
    redirectTo,
    router,
    mustChangePassword,
    pathname,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  if (isAuthenticated && mustChangePassword && pathname !== "/changer-mot-de-passe") {
    return null;
  }

  return <>{children}</>;
}
