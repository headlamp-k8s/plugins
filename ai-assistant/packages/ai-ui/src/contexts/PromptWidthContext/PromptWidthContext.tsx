import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

/** Shared prompt width state used by chat layout consumers. */
export interface PromptWidthContextType {
  /** Current prompt width CSS value. */
  promptWidth: string;
  /**
   * Updates the stored prompt width.
   *
   * @param width - New CSS width value.
   * @returns No value.
   */
  setPromptWidth: (width: string) => void;
}

const PromptWidthContext = createContext<PromptWidthContextType | undefined>(undefined);

/** Props for {@link PromptWidthProvider}. */
export interface PromptWidthProviderProps {
  /** Descendant elements that consume prompt width state. */
  children: ReactNode;
  /** Prompt width supplied by the host and synchronized when it changes. */
  initialWidth?: string;
}

/**
 * Provides prompt width state to components that align with the chat input.
 *
 * @param props - Provider children and optional initial width.
 * @returns Context provider wrapping the supplied children.
 */
export const PromptWidthProvider: React.FC<PromptWidthProviderProps> = ({
  children,
  initialWidth = '400px',
}) => {
  const [promptWidth, setPromptWidth] = useState<string>(initialWidth);

  useEffect(() => {
    setPromptWidth(initialWidth);
  }, [initialWidth]);

  return (
    <PromptWidthContext.Provider value={{ promptWidth, setPromptWidth }}>
      {children}
    </PromptWidthContext.Provider>
  );
};

/**
 * Returns the shared prompt width context and enforces provider usage.
 *
 * @returns Current prompt width and its state updater.
 * @throws When called outside a {@link PromptWidthProvider}.
 */
export const usePromptWidth = (): PromptWidthContextType => {
  const context = useContext(PromptWidthContext);
  if (context === undefined) {
    throw new Error('usePromptWidth must be used within a PromptWidthProvider');
  }
  return context;
};
