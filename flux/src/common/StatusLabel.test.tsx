import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('keeps the status as visible text and exposes the message as a description on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <StatusLabel
        item={itemWithReady({ status: 'False', reason: 'BuildFailed', message: 'build failed' })}
      />
    );
    const label = screen.getByText('Failed');

    await user.tab();
    expect(label).toHaveFocus();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('build failed');
    expect(label).toHaveAccessibleDescription('build failed');
    expect(label).not.toHaveAccessibleName('build failed');
    expect(label).toHaveTextContent('Failed');
  });

  it('is not focusable and shows no tooltip when there is no message', async () => {
    const user = userEvent.setup();
    render(<StatusLabel item={itemWithReady({ status: 'True', reason: 'Succeeded' })} />);
    const label = screen.getByText('Ready');

    await user.tab();
    expect(label).not.toHaveFocus();

    await user.hover(label);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
