import { toast, type ToastOptions } from "react-toastify";
import type { ToastType } from "../types/toasttypes";

export const showToast = (message: string, type: ToastType = "default") => {
  const toastConfig: ToastOptions = {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  if (type === "default") {
    toast(message, toastConfig);
    return;
  }

  toast[type](message, toastConfig);
};
