import { showToast } from "../../utils/toasts";
import { useErrorStore } from "../../infrastructure/store/errorStore";

const criticalStatuses = [503, 500, 403, 401, 404];

const handleHttpError = (res: Response, url: string, skipRedirect?: boolean) => {
  if (criticalStatuses.includes(res.status) && !skipRedirect) {
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
  } else if (res.status === 404) {
    showToast("Requested resource not found.", "error");
  }
};

export const get = async (
  url: string,
  options?: { skipRedirect?: boolean },
) => {
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      handleHttpError(res, url, options?.skipRedirect);
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
    console.error("Centralized API Get Error:", error);
    if (
      error.message &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("fetch"))
    ) {
      showToast("Server is unreachable. Please try again later.", "error");
    }
    throw error;
  }
};

export const post = async (
  url: string,
  payload: unknown,
  options?: { skipRedirect?: boolean },
) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      handleHttpError(res, url, options?.skipRedirect);
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
    console.error("Centralized API Post Error:", error);
    if (
      error.message &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("fetch"))
    ) {
      showToast("Server is unreachable. Please try again later.", "error");
    }
    throw error;
  }
};


