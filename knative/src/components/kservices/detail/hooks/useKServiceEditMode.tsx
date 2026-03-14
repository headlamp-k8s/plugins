import React, { createContext, useContext, useState } from 'react';

interface EditStateContext {
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
}

interface KServiceEditContextProviderProps {
  children: React.ReactNode;
}

const KServiceEditContext = createContext<EditStateContext | null>(null);

export function KServiceEditContextProvider({ children }: KServiceEditContextProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <KServiceEditContext.Provider value={{ isEditMode, setIsEditMode }}>
      {children}
    </KServiceEditContext.Provider>
  );
}

export function useKServiceEditMode() {
  const context = useContext(KServiceEditContext);
  if (!context) {
    throw new Error('useKServiceEditMode must be used within a KServiceEditContextProvider');
  }
  return context;
}
