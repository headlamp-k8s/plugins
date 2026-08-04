import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DeploymentProgress } from './deploymentprogress';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({
    t: (key: string, opts: Record<string, unknown> = {}) =>
      key.replace(/{{(\w+)}}/g, (_, name) => String(opts[name])),
  }),
}));

describe('DeploymentProgress', () => {
  it('gives the progress bar an accessible name and value text', () => {
    render(
      <DeploymentProgress
        canary={{ status: { canaryWeight: 20 }, spec: { analysis: { maxWeight: 40 } } }}
      />
    );
    const bar = screen.getByRole('progressbar', { name: 'Canary progress' });
    expect(bar.getAttribute('aria-valuetext')).toBe('50.00% Complete');
  });

  it('names the progress bar when there is no progress data', () => {
    render(<DeploymentProgress canary={{ status: {}, spec: { analysis: { maxWeight: 40 } } }} />);
    const bar = screen.getByRole('progressbar', { name: 'Canary progress' });
    expect(bar.getAttribute('aria-valuetext')).toBe('No progress data');
  });
});
