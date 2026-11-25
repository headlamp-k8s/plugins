/*
 * Copyright 2026 The Kubernetes Authors
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

// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createInstance, type Resource } from 'i18next';
import { readFileSync } from 'node:fs';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { SandboxClaimList, SandboxList, SandboxTemplateList, SandboxWarmPoolList } from '.';

const translations = createInstance();
let translationsReady = false;

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    ready: translationsReady,
    i18n: translationsReady ? translations : null,
    t: (key: string) => (translationsReady ? translations.t(key) : ''),
  }),
}));

vi.mock('../resources', () => ({
  Sandbox: class {},
  SandboxClaim: class {},
  SandboxTemplate: class {},
  SandboxWarmPool: class {},
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: () => null,
  ResourceListView({ columns }: { columns: (string | { id: string; label: string })[] }) {
    // Model Headlamp retaining the header labels from the first render.
    const [headers] = useState(() =>
      columns.map(column => (typeof column === 'string' ? { id: column, label: column } : column))
    );
    return (
      <table>
        <thead>
          <tr>
            {headers.map(({ id, label }) => (
              <th key={id}>{label}</th>
            ))}
          </tr>
        </thead>
      </table>
    );
  },
}));

beforeAll(async () => {
  const plugin: { name: string; headlamp: { i18n: string[]; fallbackLng: string } } = JSON.parse(
    readFileSync('package.json', 'utf8')
  );
  const resources: Resource = {};
  for (const language of plugin.headlamp.i18n) {
    resources[language] = {
      [plugin.name]: JSON.parse(readFileSync(`locales/${language}/translation.json`, 'utf8')),
    };
  }
  await translations.init({
    lng: 'en',
    fallbackLng: plugin.headlamp.fallbackLng,
    ns: [plugin.name],
    defaultNS: plugin.name,
    resources,
    returnEmptyString: false,
  });
});

beforeEach(async () => {
  translationsReady = false;
  await translations.changeLanguage('en');
});
afterEach(cleanup);

const lists = [
  ['Sandbox', SandboxList],
  ['Claim', SandboxClaimList],
  ['WarmPool', SandboxWarmPoolList],
  ['Template', SandboxTemplateList],
] as const;

it.each(lists)('waits for translations before mounting the %s list', (_name, List) => {
  const { rerender } = render(<List />);
  expect(screen.queryByRole('table')).toBeNull();

  translationsReady = true;
  rerender(<List />);
  expect(screen.getByRole('table')).toBeTruthy();
});

it.each(lists)(
  'refreshes the %s table when the host language changes but translations fall back to English',
  async (_name, List) => {
    translationsReady = true;
    const { rerender } = render(<List />);
    const englishTable = screen.getByRole('table');

    await translations.changeLanguage('fr');
    expect(translations.resolvedLanguage).toBe('en');
    rerender(<List />);
    expect(screen.getByRole('table')).not.toBe(englishTable);
  }
);

it('renders translated custom headers after loading and switching to Simplified Chinese', async () => {
  const { rerender } = render(<SandboxList />);

  translationsReady = true;
  rerender(<SandboxList />);
  expect(screen.getByRole('columnheader', { name: 'Ready' })).toBeTruthy();

  await translations.changeLanguage('zh');
  rerender(<SandboxList />);
  expect(screen.getByRole('columnheader', { name: '就绪' })).toBeTruthy();
});
