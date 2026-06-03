import { showToast } from "../../utils/toasts";
import { useAuthStore } from "../../infrastructure/store/authStore";

const handleHttpError = (res: Response, skipRedirect?: boolean) => {
  if (skipRedirect) return;
  if (res.status >= 500) {
    showToast("Server error. Redirecting to status page...", "error");
    window.location.href = '/503';
  } else if (res.status === 404) {
    showToast("Requested resource not found.", "error");
    window.location.href = '/404';
  }
};

export const get = async (url: string, options?: { skipRedirect?: boolean }) => {
  try {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, { 
      headers,
      credentials: "include" 
    });
    if (!res.ok) {
      handleHttpError(res, options?.skipRedirect);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || errorData.msg || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error: any) {
    console.error("Centralized API Get Error:", error);
    if (!options?.skipRedirect && error.message && (error.message.includes("Failed to fetch") || error.message.includes("fetch"))) {
      showToast("Server is unreachable. Please try again later.", "error");
      window.location.href = '/503';
    }
    throw error;
  }
};

export const post = async (url: string, payload: unknown, options?: { skipRedirect?: boolean }) => {
  try {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      "Content-type": "application/json; charset=UTF-8",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
      credentials: "include"
    });

    if (!res.ok) {
      handleHttpError(res, options?.skipRedirect);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || errorData.msg || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    console.error("Centralized API Post Error:", error);
    if (!options?.skipRedirect && error.message && (error.message.includes("Failed to fetch") || error.message.includes("fetch"))) {
      showToast("Server is unreachable. Please try again later.", "error");
      window.location.href = '/503';
    }
    throw error;
  }
};
