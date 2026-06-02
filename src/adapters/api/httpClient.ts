import { showToast } from "../../utils/toasts";

const handleHttpError = (res: Response) => {
  if (res.status >= 500) {
    showToast("Server error. Redirecting to status page...", "error");
    window.location.href = '/503';
  } else if (res.status === 404) {
    showToast("Requested resource not found.", "error");
    window.location.href = '/404';
  }
};

export const get = async (url: string) => {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      handleHttpError(res);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || errorData.msg || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error: any) {
    console.error("Centralized API Get Error:", error);
    if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("fetch"))) {
      showToast("Server is unreachable. Please try again later.", "error");
      window.location.href = '/503';
    }
    throw error;
  }
};

export const post = async (url: string, payload: unknown) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
      credentials: "include"
    });

    if (!res.ok) {
      handleHttpError(res);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || errorData.msg || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    console.error("Centralized API Post Error:", error);
    if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("fetch"))) {
      showToast("Server is unreachable. Please try again later.", "error");
      window.location.href = '/503';
    }
    throw error;
  }
};
