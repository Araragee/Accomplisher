import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export type ConfirmFunction = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export interface ConfirmProviderProps {
  children: React.ReactNode;
}

interface ConfirmState extends ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

export function ConfirmProvider({ children }: ConfirmProviderProps): React.JSX.Element {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFunction>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({
          title: 'Are you sure?',
          message: '',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          danger: false,
          ...opts,
        });
      }),
    []
  );

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        description={state?.message}
        size="sm"
        footer={
          state && (
            <>
              <Button variant="ghost" onClick={() => close(false)}>
                {state.cancelLabel}
              </Button>
              <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
                {state.confirmLabel}
              </Button>
            </>
          )
        }
      >
        {null}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFunction {
  const ctx = useContext(ConfirmContext);
  return ctx || (async () => window.confirm('Are you sure?'));
}
