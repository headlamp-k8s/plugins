import React, { createContext, ReactNode, useContext, useState } from 'react';

interface PromptWidthContextType {
  promptWidth: string;
  setPromptWidth: (width: string) => void;
}

const PromptWidthContext = createContext<PromptWidthContextType | undefined>(undefined);

interface PromptWidthProviderProps {
  children: ReactNode;
  initialWidth?: string;
}

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

export const usePromptWidth = (): PromptWidthContextType => {
  const context = useContext(PromptWidthContext);
  if (context === undefined) {
    throw new Error('usePromptWidth must be used within a PromptWidthProvider');
  }
  return context;
};
