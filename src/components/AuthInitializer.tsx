"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSessionIfNeeded } = useAuth();

  useEffect(() => {
    // Initialiser la session au démarrage de l'app
    checkSessionIfNeeded();
  }, [checkSessionIfNeeded]);

  return <>{children}</>;
}
