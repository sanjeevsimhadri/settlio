import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps } from './Alert';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

interface ToastState extends ToastProps {}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastState = {
      ...toast,
      id,
      onClose: removeToast,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Keep only the most recent toasts
      return updated.slice(0, maxToasts);
    });
  }, [removeToast, maxToasts]);

  const showSuccess = useCallback((message: string) => {
    showToast({ type: 'success', message });
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast({ type: 'error', message });
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast({ type: 'warning', message });
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast({ type: 'info', message });
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;