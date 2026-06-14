import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import AIChatContent, { type AIChatTextStreamProps } from './AIChatContent';
import {
  baseAIChatContentArgs,
  loadingArgs,
  withErrorArgs,
  withMessagesArgs,
} from './AIChatContent.stories';

const textStreamMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function TextStreamSlot(props: AIChatTextStreamProps): React.ReactElement {
  textStreamMock(props);
  return (
    <section aria-label="Chat stream">
      {props.history.map((message, index) => (
        <p key={`${message.role}-${index}`}>{message.content}</p>
      ))}
      {props.isLoading && <span>Loading response</span>}
    </section>
  );
}

function SettingsLink({ children }: { children: React.ReactNode }): React.ReactElement {
  return <a href="#settings">{children}</a>;
}

it('forwards chat state and callbacks to the text stream slot', () => {
  render(<AIChatContent {...withMessagesArgs} TextStreamSlot={TextStreamSlot} />);

  expect(screen.getByText('Show me unhealthy pods in the default namespace.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(textStreamMock).toHaveBeenCalledWith(
    expect.objectContaining({
      history: withMessagesArgs.history,
      isLoading: false,
      apiError: null,
      onOperationSuccess: withMessagesArgs.onOperationSuccess,
      onOperationFailure: withMessagesArgs.onOperationFailure,
      onYamlAction: withMessagesArgs.onYamlAction,
      onRetryTool: withMessagesArgs.onRetryTool,
    })
  );
});

it('renders loading state through the stream slot', () => {
  render(<AIChatContent {...loadingArgs} TextStreamSlot={TextStreamSlot} />);
  expect(screen.getByText('Loading response')).toBeTruthy();
});

it('renders a single settings link for API errors and passes axe', async () => {
  render(
    <main>
      <AIChatContent
        {...withErrorArgs}
        TextStreamSlot={TextStreamSlot}
        SettingsLinkSlot={SettingsLink}
      />
    </main>
  );

  expect(screen.getByRole('alert').textContent).toContain('Failed to connect');
  expect(screen.getByRole('link', { name: 'Settings' })).toHaveProperty('hash', '#settings');
  expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  await expect(runAxe()).resolves.toEqual([]);
});

it('shows an API error without an action when no settings slot is provided', () => {
  render(
    <AIChatContent
      {...baseAIChatContentArgs}
      apiError="Request failed"
      TextStreamSlot={TextStreamSlot}
      SettingsLinkSlot={undefined}
    />
  );

  expect(screen.getByRole('alert').textContent).toBe('Request failed');
  expect(screen.queryByRole('link')).toBeNull();
});
