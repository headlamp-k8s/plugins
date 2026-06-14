import React, { createContext, ReactNode, useContext, useState } from 'react';

/** Shared prompt width state used by chat layout consumers. */
interface PromptWidthContextType {
  /** Current prompt width CSS value. */
  promptWidth: string;
  /** Updates the stored prompt width. */
  setPromptWidth: (width: string) => void;
}

const PromptWidthContext = createContext<PromptWidthContextType | undefined>(undefined);

/** Props for {@link PromptWidthProvider}. */
interface PromptWidthProviderProps {
  /** Descendant elements that consume prompt width state. */
  children: ReactNode;
  /** Initial prompt width used before measurements are available. */
  initialWidth?: string;
}

/** Provides prompt width state to components that need to align with the chat input. */
export const PromptWidthProvider: React.FC<PromptWidthProviderProps> = ({
  children,
  initialWidth = '400px',
}) => {
  const [promptWidth, setPromptWidth] = useState<string>(initialWidth);

  return (
    <PromptWidthContext.Provider value={{ promptWidth, setPromptWidth }}>
      {children}
    </PromptWidthContext.Provider>
  );
};

/** Returns the shared prompt width context and enforces provider usage. */
export const usePromptWidth = (): PromptWidthContextType => {
  const context = useContext(PromptWidthContext);
  if (context === undefined) {
    throw new Error('usePromptWidth must be used within a PromptWidthProvider');
  }
  return context;
};
