"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface PageHeaderContextValue {
  actions: React.ReactNode;
  setActions: (actions: React.ReactNode) => void;
  clearActions: () => void;
  titleOverride: React.ReactNode;
  setTitleOverride: (title: React.ReactNode) => void;
  clearTitleOverride: () => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [actions, setActionsState] = useState<React.ReactNode>(null);
  const [titleOverride, setTitleState] = useState<React.ReactNode>(null);

  const setActions = useCallback((node: React.ReactNode) => {
    setActionsState(node);
  }, []);

  const clearActions = useCallback(() => {
    setActionsState(null);
  }, []);

  const setTitleOverride = useCallback((node: React.ReactNode) => {
    setTitleState(node);
  }, []);

  const clearTitleOverride = useCallback(() => {
    setTitleState(null);
  }, []);

  return (
    <PageHeaderContext
      value={{
        actions,
        setActions,
        clearActions,
        titleOverride,
        setTitleOverride,
        clearTitleOverride,
      }}
    >
      {children}
    </PageHeaderContext>
  );
}

function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error(
      "usePageHeaderContext must be used within a PageHeaderProvider"
    );
  }
  return ctx;
}

export function usePageHeaderActions() {
  return usePageHeaderContext().actions;
}

export function usePageHeaderTitle() {
  return usePageHeaderContext().titleOverride;
}

/**
 * Renders action buttons into the shared page header.
 * Place this component anywhere in a page to inject buttons
 * into the top header bar.
 */
export function PageActions({ children }: { children: React.ReactNode }) {
  const ctx = usePageHeaderContext();

  useEffect(() => {
    ctx.setActions(children);
    return () => ctx.clearActions();
  });

  return null;
}

/**
 * Overrides the page title in the shared header.
 * Useful for sub-pages that need breadcrumb-style navigation
 * (e.g., "Menu > Menu Name").
 */
export function PageTitle({ children }: { children: React.ReactNode }) {
  const ctx = usePageHeaderContext();

  useEffect(() => {
    ctx.setTitleOverride(children);
    return () => ctx.clearTitleOverride();
  });

  return null;
}
