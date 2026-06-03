import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { verifySession } from "../adapters/api/authApi";

export const useAuthSync = () => {
  const { setAuth, clearAuth, setAuthReady } = useAuthStore();

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const session = await verifySession();
        if (session?.user) {
          setAuth(session.user);
        }
      } catch {
        if (import.meta.env.DEV) {
          console.debug("Auth session bootstrap skipped or failed, keeping persisted auth state.");
        }
      } finally {
        setAuthReady(true);
      }
    };

    bootstrapAuth();
  }, [clearAuth, setAuth, setAuthReady]);
};
