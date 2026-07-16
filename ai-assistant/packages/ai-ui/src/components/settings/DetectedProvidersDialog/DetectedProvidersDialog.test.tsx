import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import DetectedProvidersDialog from './DetectedProvidersDialog';
import { multipleProvidersArgs, singleProviderArgs } from './DetectedProvidersDialog.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
    <span data-icon={icon} {...props} />
  ),
}));

afterEach(cleanup);

it('renders detected providers selected by default and passes axe', async () => {
  render(<DetectedProvidersDialog {...multipleProvidersArgs} />);

  expect(screen.getByRole('heading', { name: 'Detected AI Providers' })).toBeTruthy();
  expect(screen.getByText('Source: GitHub CLI')).toBeTruthy();
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  expect(screen.getAllByRole('checkbox').every(control => control.hasAttribute('checked'))).toBe(
    true
  );
  expect(screen.getByRole('button', { name: 'Add Selected (3)' })).toHaveProperty(
    'disabled',
    false
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('adds only selected providers in display order', () => {
  const onAddProviders = vi.fn();
  render(<DetectedProvidersDialog {...multipleProvidersArgs} onAddProviders={onAddProviders} />);

  fireEvent.click(screen.getByRole('checkbox', { name: /Ollama/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Selected (2)' }));

  expect(onAddProviders).toHaveBeenCalledWith([
    multipleProvidersArgs.detectedProviders[0],
    multipleProvidersArgs.detectedProviders[2],
  ]);
});

it('preserves choices for equivalent arrays and resets for a changed provider list', async () => {
  const { rerender } = render(<DetectedProvidersDialog {...multipleProvidersArgs} />);
  const ollamaCheckbox = screen.getByRole('checkbox', { name: /Ollama/ });
  fireEvent.click(ollamaCheckbox);
  expect(ollamaCheckbox).toHaveProperty('checked', false);

  rerender(
    <DetectedProvidersDialog
      {...multipleProvidersArgs}
      detectedProviders={[...multipleProvidersArgs.detectedProviders]}
    />
  );
  expect(screen.getByRole('checkbox', { name: /Ollama/ })).toHaveProperty('checked', false);

  rerender(<DetectedProvidersDialog {...singleProviderArgs} />);
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: /GitHub Copilot/ })).toHaveProperty('checked', true)
  );
  expect(screen.getByRole('button', { name: 'Add Selected (1)' })).toHaveProperty(
    'disabled',
    false
  );
});

it('resets choices when the same provider list is reopened', async () => {
  const { rerender } = render(<DetectedProvidersDialog {...multipleProvidersArgs} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /Ollama/ }));
  expect(screen.getByRole('button', { name: 'Add Selected (2)' })).toBeTruthy();

  rerender(<DetectedProvidersDialog {...multipleProvidersArgs} open={false} />);
  rerender(<DetectedProvidersDialog {...multipleProvidersArgs} open />);

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Add Selected (3)' })).toBeTruthy()
  );
});

it('renders an empty provider list with add disabled', () => {
  const { rerender } = render(
    <DetectedProvidersDialog {...multipleProvidersArgs} detectedProviders={[]} open={false} />
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  rerender(<DetectedProvidersDialog {...multipleProvidersArgs} detectedProviders={[]} open />);
  expect(screen.getByRole('button', { name: 'Add Selected (0)' })).toHaveProperty('disabled', true);
});

it('disables add when nothing is selected and supports re-selection', () => {
  render(<DetectedProvidersDialog {...singleProviderArgs} />);
  const checkbox = screen.getByRole('checkbox', { name: /GitHub Copilot/ });

  fireEvent.click(checkbox);
  expect(screen.getByRole('button', { name: 'Add Selected (0)' })).toHaveProperty('disabled', true);
  fireEvent.click(checkbox);
  expect(screen.getByRole('button', { name: 'Add Selected (1)' })).toHaveProperty(
    'disabled',
    false
  );
});

it('dismisses every detected provider and closes with or without a dismiss callback', () => {
  const onDismiss = vi.fn();
  const onClose = vi.fn();
  const { rerender } = render(
    <DetectedProvidersDialog {...multipleProvidersArgs} onDismiss={onDismiss} onClose={onClose} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Not Now' }));
  expect(onDismiss).toHaveBeenCalledWith(multipleProvidersArgs.detectedProviders);
  expect(onClose).toHaveBeenCalledOnce();

  rerender(
    <DetectedProvidersDialog {...singleProviderArgs} onDismiss={undefined} onClose={onClose} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Not Now' }));
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('uses the fallback icon and forwards close handling to a custom dialog slot', () => {
  const onClose = vi.fn();
  function DialogSlot({
    children,
    onClose: close,
  }: PropsWithChildren<{ onClose?: () => void }>): React.ReactElement {
    return (
      <section role="dialog" aria-label="Detected providers">
        <button onClick={close}>Slot close</button>
        {children}
      </section>
    );
  }
  const unknownProvider = {
    ...singleProviderArgs.detectedProviders[0],
    providerId: 'unknown-provider',
  };
  const { container } = render(
    <DetectedProvidersDialog
      {...singleProviderArgs}
      detectedProviders={[unknownProvider]}
      onClose={onClose}
      DialogSlot={DialogSlot}
    />
  );

  expect(container.querySelector('[data-icon="mdi:robot"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Slot close' }));
  expect(onClose).toHaveBeenCalledOnce();
});
