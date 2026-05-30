export type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

export const createToast = (toast: ToastState) => toast;
