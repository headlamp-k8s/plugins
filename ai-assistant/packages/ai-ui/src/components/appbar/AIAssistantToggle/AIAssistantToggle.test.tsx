import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import AIAssistantToggle from './AIAssistantToggle';
import {
  closedToggleArgs,
  openToggleArgs,
  unconfiguredToggleArgs,
} from './AIAssistantToggle.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span aria-hidden="true" data-icon={icon} />,
}));

afterEach(cleanup);

it('renders the translated closed story, toggles the panel, and passes axe', async () => {
  const onToggle = vi.fn();
  render(
    <main>
      <AIAssistantToggle {...closedToggleArgs} onToggle={onToggle} />
    </main>
  );

  const toggle = screen.getByRole('button', { name: 'AI Assistant' });
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(toggle);
  expect(onToggle).toHaveBeenCalledOnce();
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders the selected open story', () => {
  render(<AIAssistantToggle {...openToggleArgs} />);

  expect(screen.getByRole('button', { name: 'AI Assistant' }).getAttribute('aria-pressed')).toBe(
    'true'
  );
});

it('uses a custom tooltip and falls back for a blank override', () => {
  const { rerender } = render(
    <AIAssistantToggle {...closedToggleArgs} tooltipTitle="Cluster assistant" icon="mdi:robot" />
  );
  expect(screen.getByRole('button', { name: 'Cluster assistant' })).toBeTruthy();
  expect(document.querySelector('[data-icon="mdi:robot"]')).not.toBeNull();

  rerender(<AIAssistantToggle {...closedToggleArgs} tooltipTitle="   " />);
  expect(screen.getByRole('button', { name: 'AI Assistant' })).toBeTruthy();
});

it('shows an accessible configuration prompt and invokes its actions', async () => {
  const onDismissPrompt = vi.fn();
  const onConfigure = vi.fn();
  render(
    <main>
      <AIAssistantToggle
        {...unconfiguredToggleArgs}
        onDismissPrompt={onDismissPrompt}
        onConfigure={onConfigure}
      />
    </main>
  );

  const dialog = await screen.findByRole('dialog', { name: 'Configure AI Assistant' });
  expect(withinDialog(dialog, 'To use the AI Assistant')).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss configuration prompt' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }));

  expect(onDismissPrompt).toHaveBeenCalledOnce();
  expect(onConfigure).toHaveBeenCalledOnce();
});

it('removes the prompt when the host hides it', async () => {
  const { rerender } = render(<AIAssistantToggle {...unconfiguredToggleArgs} />);
  expect(await screen.findByRole('dialog')).toBeTruthy();

  rerender(<AIAssistantToggle {...closedToggleArgs} />);

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

function withinDialog(dialog: HTMLElement, text: string): HTMLElement | null {
  return (
    Array.from(dialog.querySelectorAll<HTMLElement>('*')).find(element =>
      element.textContent?.includes(text)
    ) ?? null
  );
}
