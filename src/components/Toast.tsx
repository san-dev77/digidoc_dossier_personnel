"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X, Trash2 } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    titleColor: "text-green-900",
    messageColor: "text-green-700",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    messageColor: "text-red-700",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
    titleColor: "text-yellow-900",
    messageColor: "text-yellow-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    messageColor: "text-blue-700",
  },
};

function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-close après la durée spécifiée
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className={`
        ${config.bgColor} ${
        config.borderColor
      } border rounded-lg shadow-lg p-4 mb-3
        transform transition-all duration-300 ease-out
        ${
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.titleColor}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`text-sm ${config.messageColor} mt-1`}>
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Modale de confirmation centrée (même gabarit que la modale de suppression de la page Agents)
function ConfirmToastModal({ toast, onClose }: ToastProps) {
  const handleCancel = () => onClose(toast.id);
  const handleConfirm = () => {
    toast.onConfirm?.();
    onClose(toast.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{toast.title}</h3>
          </div>
          {toast.message && (
            <p className="text-gray-600 mb-6">{toast.message}</p>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-primary-700 hover:bg-gray-50 transition-colors"
            >
              {toast.cancelLabel || "Annuler"}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {toast.confirmLabel || "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container pour afficher les toasts
export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const confirmToasts = toasts.filter((toast) => toast.onConfirm);
  const regularToasts = toasts.filter((toast) => !toast.onConfirm);

  return (
    <>
      {regularToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          {regularToasts.map((toast) => (
            <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </div>
      )}
      {confirmToasts.map((toast) => (
        <ConfirmToastModal key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </>
  );
}

// Hook pour gérer les toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (title: string, message?: string, duration?: number) => {
    addToast({ type: "success", title, message, duration });
  };

  const error = (title: string, message?: string, duration?: number) => {
    addToast({ type: "error", title, message, duration });
  };

  const warning = (title: string, message?: string, duration?: number) => {
    addToast({ type: "warning", title, message, duration });
  };

  const info = (title: string, message?: string, duration?: number) => {
    addToast({ type: "info", title, message, duration });
  };

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; cancelLabel?: string }
  ) => {
    addToast({
      type: "warning",
      title,
      message,
      duration: 0,
      onConfirm,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    confirm,
  };
}
