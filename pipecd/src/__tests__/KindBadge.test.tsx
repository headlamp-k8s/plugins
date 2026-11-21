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

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KindBadge } from '../components/KindBadge';
import type { ApplicationKind } from '../types/pipecd';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
});

const EXPECTED: Record<ApplicationKind, string> = {
  KUBERNETES: 'Kubernetes',
  TERRAFORM: 'Terraform',
  CLOUD_RUN: 'Cloud Run',
  LAMBDA: 'Lambda',
  ECS: 'ECS',
  UNKNOWN: 'Unknown',
};

describe('KindBadge', () => {
  it.each(Object.keys(EXPECTED) as ApplicationKind[])('labels %s', kind => {
    render(<KindBadge kind={kind} />);

    expect(screen.getByText(EXPECTED[kind])).toBeTruthy();
  });

  it('does not render a raw enum name', () => {
    render(<KindBadge kind="CLOUD_RUN" />);

    expect(screen.queryByText('CLOUD_RUN')).toBeNull();
  });

  it('shows an unrecognised kind as it came, rather than blank', () => {
    render(<KindBadge kind={'NEW_PLATFORM' as ApplicationKind} />);

    expect(screen.getByText('NEW_PLATFORM')).toBeTruthy();
  });

  // The badge picks a lighter text colour in dark mode so it stays readable.
  it('uses a lighter text colour in dark mode than in light mode', () => {
    const colourIn = (mode: 'light' | 'dark'): string => {
      const { unmount } = render(
        <ThemeProvider theme={createTheme({ palette: { mode } })}>
          <KindBadge kind="TERRAFORM" />
        </ThemeProvider>
      );
      const colour = getComputedStyle(screen.getByText('Terraform')).color;
      unmount();
      return colour;
    };

    // Sum of the red, green and blue values: higher means lighter.
    const brightness = (colour: string): number => {
      const channels =
        colour
          .match(/\d+(\.\d+)?/g)
          ?.slice(0, 3)
          .map(Number) ?? [];
      expect(channels).toHaveLength(3);
      return channels.reduce((sum, c) => sum + c, 0);
    };

    expect(brightness(colourIn('dark'))).toBeGreaterThan(brightness(colourIn('light')));
  });
});
