import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { verifySession } from "../adapters/api/authApi";

export const useAuthSync = () => {
  const { setAuth, clearAuth, setAuthReady, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const session = await verifySession();
        if (session?.user) {
          setAuth(session.user);
        } else {
          if (isAuthenticated) {
            clearAuth();
          }
        }
      } catch {
        if (isAuthenticated) {
          clearAuth();
        }
      } finally {
        setAuthReady(true);
      }
    };

    getUserInfo();
  }, [setAuth, clearAuth, setAuthReady, isAuthenticated]);
};
