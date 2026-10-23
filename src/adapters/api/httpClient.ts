import { showToast } from "../../utils/toast";
import { useErrorStore } from "../../infrastructure/store/errorStore";

const criticalStatuses = [503, 500, 403, 401, 404];

export interface RequestOptions {
  skipRedirect?: boolean;
  silent?: boolean;
}

const handleHttpError = (res: Response, url: string, options?: RequestOptions) => {
  if (options?.silent) return;

  if (criticalStatuses.includes(res.status) && !options?.skipRedirect) {
    useErrorStore.getState().showErrorModal({
      status: res.status,
      title: `Server Notice (${res.status})`,
      message: `An error occurred while attempting to process your request at ${url}.`,
      onRetry: () => {
        window.location.reload();
      },
    });
  } else if (res.status >= 500) {
    showToast(`Server error (${res.status}). Please try again later.`, "error");
  } else if (res.status === 404 && !options?.skipRedirect) {
    showToast("Requested resource not found.", "error");
  }
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const get = async (
  url: string,
  options?: RequestOptions,
) => {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }
    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Get Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};

export const post = async (
  url: string,
  payload: unknown,
  options?: RequestOptions,
) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Post Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};

export const put = async (
  url: string,
  payload: unknown,
  options?: RequestOptions,
) => {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Put Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};


