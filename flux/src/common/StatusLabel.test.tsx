import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import StatusLabel from './StatusLabel';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({
    t: (key: string, opts: Record<string, unknown> = {}) =>
      key.replace(/{{(\w+)}}/g, (_, name) => String(opts[name])),
  }),
}));

function itemWithReady(ready: Record<string, string>) {
  return { jsonData: { spec: {}, status: { conditions: [{ type: 'Ready', ...ready }] } } } as any;
}

describe('StatusLabel', () => {
  it('keeps the visible status as the accessible name and exposes the message as a description', () => {
    render(
      <StatusLabel
        item={itemWithReady({ status: 'False', reason: 'BuildFailed', message: 'build failed' })}
      />
    );
    const label = screen.getByText('Failed');
    expect(label.getAttribute('aria-label')).toBeNull();
    expect(label.getAttribute('title')).toBe('build failed');
    expect(label.getAttribute('tabindex')).toBe('0');
  });

  it('is not focusable when there is no message', () => {
    render(<StatusLabel item={itemWithReady({ status: 'True', reason: 'Succeeded' })} />);
    expect(screen.getByText('Ready').getAttribute('tabindex')).toBeNull();
  });
});
