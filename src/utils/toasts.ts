import { toast, type ToastOptions } from "react-toastify";
import type { ToastType } from "../types/toasttypes";

export const showToast = (message: string, type: ToastType = "default") => {
  const toastConfig: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  };

  if (type === "default") {
    toast(message, toastConfig);
    return;
  }

  toast[type](message, toastConfig);
};