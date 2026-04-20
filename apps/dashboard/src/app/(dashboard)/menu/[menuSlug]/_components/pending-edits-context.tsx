"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Two separate contexts so that EditableCell (which only needs register/unregister)
 * never re-renders when `hasPendingEdits` toggles, and only the toolbar re-renders.
 */

const PendingEditsActionsContext = createContext<{
  register: (id: string) => void;
  unregister: (id: string) => void;
}>({
  register: () => {
    /* noop default */
  },
  unregister: () => {
    /* noop default */
  },
});

const PendingEditsStateContext = createContext(false);

export function PendingEditsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingRef = useRef(new Set<string>());
  const [hasPendingEdits, setHasPendingEdits] = useState(false);

  const register = useCallback((id: string) => {
    const prev = pendingRef.current.size;
    pendingRef.current.add(id);
    if (prev === 0) {
      setHasPendingEdits(true);
    }
  }, []);

  const unregister = useCallback((id: string) => {
    pendingRef.current.delete(id);
    if (pendingRef.current.size === 0) {
      setHasPendingEdits(false);
    }
  }, []);

  const actions = useMemo(
    () => ({ register, unregister }),
    [register, unregister]
  );

  return (
    <PendingEditsActionsContext.Provider value={actions}>
      <PendingEditsStateContext.Provider value={hasPendingEdits}>
        {children}
      </PendingEditsStateContext.Provider>
    </PendingEditsActionsContext.Provider>
  );
}

/** Used by EditableCell — stable reference, never triggers re-render. */
export function usePendingEditsActions() {
  return useContext(PendingEditsActionsContext);
}

/** Used by the toolbar — re-renders only when the boolean flips. */
export function useHasPendingEdits() {
  return useContext(PendingEditsStateContext);
}
