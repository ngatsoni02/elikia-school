import React, { useState, useEffect, useCallback, createContext, useContext, PropsWithChildren } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const typeStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: 'bg-emerald-500/15', icon: '\u2713', border: 'border-emerald-500/40' },
  error:   { bg: 'bg-red-500/15',     icon: '\u2717', border: 'border-red-500/40' },
  warning: { bg: 'bg-amber-500/15',   icon: '\u26A0', border: 'border-amber-500/40' },
  info:    { bg: 'bg-blue-500/15',     icon: '\u2139', border: 'border-blue-500/40' },
};

const ToastItem = ({ toast, onDone }: { toast: Toast; onDone: () => void }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const s = typeStyles[toast.type];

  return (
    <div
      className={`pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-3 min-w-[280px] max-w-[420px] transition-all duration-300 ${s.bg} ${s.border} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      <span className="text-lg">{s.icon}</span>
      <span className="text-sm font-medium text-brand-text flex-1">{toast.message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDone, 300); }} className="text-brand-text-secondary hover:text-brand-text text-xs ml-2">
        \u2715
      </button>
    </div>
  );
};
