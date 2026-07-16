import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import AIAssistantHeader, { type ActionButtonSlotProps } from './AIAssistantHeader';
import {
  defaultHeaderArgs,
  disabledSettingsHeaderArgs,
  testModeHeaderArgs,
} from './AIAssistantHeader.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span aria-hidden="true" data-icon={icon} />,
}));

afterEach(cleanup);

it('renders translated default actions, invokes callbacks, and passes axe', async () => {
  const onSettings = vi.fn();
  const onClose = vi.fn();
  render(
    <main>
      <AIAssistantHeader {...defaultHeaderArgs} onSettings={onSettings} onClose={onClose} />
    </main>
  );

  expect(screen.getByRole('heading', { name: 'AI Assistant (preview)' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onSettings).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders test mode as a sibling of the semantic heading', () => {
  render(<AIAssistantHeader {...testModeHeaderArgs} />);

  const heading = screen.getByRole('heading', { name: 'AI Assistant (preview)' });
  const testMode = screen.getByText('TEST MODE');
  expect(heading.contains(testMode)).toBe(false);
});

it('disables the settings action in the disabled story', () => {
  render(<AIAssistantHeader {...disabledSettingsHeaderArgs} />);

  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Settings' }).disabled).toBe(true);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Close' }).disabled).toBe(false);
});

it('forwards typed IconButton props through a custom action slot', () => {
  const calls: ActionButtonSlotProps[] = [];
  function CustomAction(props: ActionButtonSlotProps): React.ReactElement {
    calls.push(props);
    return (
      <button
        type="button"
        disabled={props.iconButtonProps?.disabled}
        data-size={props.iconButtonProps?.size}
        onClick={props.onClick}
      >
        {props.description}
      </button>
    );
  }

  render(<AIAssistantHeader {...disabledSettingsHeaderArgs} ActionButtonSlot={CustomAction} />);

  expect(calls.map(call => call.icon)).toEqual(['mdi:settings', 'mdi:close']);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Settings' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Close' }).getAttribute('data-size')).toBe('small');
});
