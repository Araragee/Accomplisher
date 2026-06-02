import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

const ConfirmContext = createContext(null);

// useConfirm()(opts) -> Promise<boolean>. Replaces window.confirm with an
// in-theme dialog. Pages call: if (await confirm({...})) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
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

  const close = (result) => {
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

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  return ctx || (async () => window.confirm('Are you sure?'));
}
