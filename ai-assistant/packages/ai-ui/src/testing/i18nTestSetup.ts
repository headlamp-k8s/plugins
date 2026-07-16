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

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Initialize i18next for tests and storybooks.
 * Returns keys as-is — no translation files needed.
 * Call this once in your test setup or storybook preview.
 */
export async function initI18nForTests(): Promise<void> {
  if (i18next.isInitialized) return;

  await i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      en: { translation: {} },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Return keys as values when no translation found
    parseMissingKeyHandler: (key: string) => key,
    keySeparator: false,
    nsSeparator: '|',
  });
}

// Auto-initialize when imported as a setup file
await initI18nForTests();
