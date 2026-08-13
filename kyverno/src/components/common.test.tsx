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

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { NotInstalledBanner } from './common';

// No i18n resources are loaded in this test environment, so the real hook resolves
// every key to ''. Mock it to return the key unchanged, matching what renders in the app.
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('NotInstalledBanner', () => {
  test('loading state renders a Loader with an accessible name', () => {
    render(<NotInstalledBanner loading />);

    expect(
      screen.getByRole('progressbar', { name: 'Detecting Kyverno resources' })
    ).toBeInTheDocument();
  });

  test('not-installed state is announced as a polite, atomic status region', () => {
    render(<NotInstalledBanner message="Kyverno was not detected on this cluster." />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toHaveTextContent('Kyverno was not detected on this cluster.');
  });
});
