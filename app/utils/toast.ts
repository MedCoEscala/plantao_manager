let toastCallback:
  | ((message: string, type?: "success" | "error" | "info" | "warning") => void)
  | null = null;

export const registerToastCallback = (
  callback: (
    message: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void
) => {
  toastCallback = callback;
};

export const showToast = (
  message: string,
  type: "success" | "error" | "info" | "warning" = "info"
) => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    console.log(`Toast (${type}): ${message}`);
  }
};

const toastUtils = {
  registerToastCallback,
  showToast,
};

export default toastUtils;
