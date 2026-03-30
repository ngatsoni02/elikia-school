import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { Button } from './Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center p-4" onClick={() => handleClose(false)}>
          <div className="bg-brand-bg rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-brand-text mb-2">{state.options.title}</h3>
              <p className="text-sm text-brand-text-secondary whitespace-pre-line">{state.options.message}</p>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="secondary" onClick={() => handleClose(false)}>
                {state.options.cancelLabel || 'Annuler'}
              </Button>
              <Button variant={state.options.variant || 'primary'} onClick={() => handleClose(true)}>
                {state.options.confirmLabel || 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
