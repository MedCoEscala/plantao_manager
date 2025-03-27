import React, { createContext, useContext, useState, ReactNode } from "react";
import Dialog, { DialogType } from "../components/ui/Dialog";

interface DialogOptions {
  type?: DialogType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({
    type: "info",
    message: "",
    title: "",
  });

  const showDialog = (dialogOptions: DialogOptions) => {
    setOptions(dialogOptions);
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    hideDialog();
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    hideDialog();
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Dialog
        visible={visible}
        type={options.type}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onClose={hideDialog}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);

  if (context === undefined) {
    throw new Error("useDialog deve ser usado dentro de um DialogProvider");
  }

  return context;
};

export default DialogProvider;
