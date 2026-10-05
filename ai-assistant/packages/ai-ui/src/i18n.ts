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

let initializationPromise: Promise<void> | null = null;

/**
 * Initializes a fallback i18next / react-i18next instance for standalone ai-ui
 * consumers such as Storybook and tests.
 *
 * **Why this is needed:**
 * The headlamp-plugin vite config does NOT externalize `react-i18next`, so
 * each plugin bundle ships its own copy. That copy is separate from the
 * Headlamp frontend's `react-i18next` and its `I18nextProvider` context.
 * Without initialization the default i18next instance has no interpolation
 * configuration, so `t('Configure {{provider}}', { provider: 'GitHub Copilot' })`
 * returns the raw key `'Configure {{provider}}'` instead of the expected
 * `'Configure GitHub Copilot'`.
 *
 * Headlamp integrations must instead provide Headlamp's plugin i18next instance
 * through `AiUiI18nProvider`. Production code must not initialize a second
 * language or resource store with this function.
 * Initialization runs synchronously because no backend resources are loaded;
 * the returned promise still reports completion or failure to callers.
 *
 * @example
 * // In a standalone preview entry point:
 * import { initAiUiI18n } from '@headlamp-k8s/ai-ui/i18n';
 * await initAiUiI18n();
 *
 * @returns Promise that resolves when the bundled i18next instance is ready.
 */
export function initAiUiI18n(): Promise<void> {
  if (i18next.isInitialized) return Promise.resolve();

  if (!initializationPromise) {
    initializationPromise = i18next
      .use(initReactI18next)
      .init({
        initImmediate: false,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        defaultNS: 'translation',
        resources: {},
      })
      .then(() => undefined)
      .catch(error => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
}
