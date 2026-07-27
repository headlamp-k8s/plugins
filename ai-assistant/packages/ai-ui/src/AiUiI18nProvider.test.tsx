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

import { createInstance } from 'i18next';
import { renderToString } from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { expect, it } from 'vitest';
import { AiUiI18nProvider } from './AiUiI18nProvider';

function TranslatedText() {
  const { t } = useTranslation();
  return <span>{t('AI Assistant')}</span>;
}

it('waits for the host i18next instance before rendering children', () => {
  const markup = renderToString(
    <AiUiI18nProvider i18n={null}>
      <span>Untranslated content</span>
    </AiUiI18nProvider>
  );

  expect(markup).toBe('');
});

it('uses the i18next instance supplied by the host plugin', async () => {
  const i18n = createInstance();
  await i18n.init({
    lng: 'de',
    resources: {
      de: { translation: { 'AI Assistant': 'KI-Assistent' } },
    },
  });

  const markup = renderToString(
    <AiUiI18nProvider i18n={i18n}>
      <TranslatedText />
    </AiUiI18nProvider>
  );

  expect(markup).toContain('KI-Assistent');
});
