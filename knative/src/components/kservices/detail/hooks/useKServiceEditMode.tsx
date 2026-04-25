/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
