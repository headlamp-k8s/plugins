/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { i18n } from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

export interface AiUiI18nProviderProps {
  children: ReactNode;
  /** Translation instance owned and configured by the host application. */
  i18n: i18n | null;
}

/**
 * Connects ai-ui's bundled react-i18next context to a host-owned i18next instance.
 * Children wait until the host has loaded its language and translation resources.
 */
export function AiUiI18nProvider({ children, i18n }: AiUiI18nProviderProps) {
  if (!i18n) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
