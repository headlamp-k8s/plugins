import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { PromptSuggestions } from './PromptSuggestions';
import {
  contentFilterErrorArgs,
  defaultPromptSuggestionsArgs,
  loadingPromptSuggestionsArgs,
} from './PromptSuggestions.stories';

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

it('renders nothing while suggestions are loading', () => {
  const { container } = render(<PromptSuggestions {...loadingPromptSuggestionsArgs} />);
  expect(container.childElementCount).toBe(0);
});

it('keeps selecting and sending as distinct accessible actions and passes axe', async () => {
  const onPromptSelect = vi.fn();
  const onPromptSend = vi.fn();
  const onErrorClear = vi.fn();
  render(
    <main>
      <PromptSuggestions
        {...defaultPromptSuggestionsArgs}
        onPromptSelect={onPromptSelect}
        onPromptSend={onPromptSend}
        onErrorClear={onErrorClear}
      />
    </main>
  );
  const prompt = defaultPromptSuggestionsArgs.suggestions[0];

  fireEvent.click(screen.getByRole('button', { name: prompt }));
  fireEvent.click(screen.getByRole('button', { name: `Send suggestion: ${prompt}` }));

  expect(onPromptSelect).toHaveBeenCalledWith(prompt);
  expect(onPromptSend).toHaveBeenCalledWith(prompt);
  expect(onErrorClear).not.toHaveBeenCalled();
  await expect(runAxe()).resolves.toEqual([]);
});

it('recognizes content-filter errors case-insensitively and clears before sending', () => {
  const calls: string[] = [];
  const prompt = contentFilterErrorArgs.suggestions[1];
  render(
    <PromptSuggestions
      {...contentFilterErrorArgs}
      apiError="Blocked by Content Filter policy"
      onErrorClear={() => calls.push('clear')}
      onPromptSend={selected => calls.push(`send:${selected}`)}
    />
  );

  expect(screen.getByText('Try one of these safe Kubernetes questions instead:')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: `Send suggestion: ${prompt}` }));
  expect(calls).toEqual(['clear', `send:${prompt}`]);
});

it('does not show filter guidance or clear unrelated API errors', () => {
  const onErrorClear = vi.fn();
  const prompt = defaultPromptSuggestionsArgs.suggestions[0];
  render(
    <PromptSuggestions
      {...defaultPromptSuggestionsArgs}
      apiError="Network unavailable"
      onErrorClear={onErrorClear}
    />
  );

  expect(screen.queryByText('Try one of these safe Kubernetes questions instead:')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: `Send suggestion: ${prompt}` }));
  expect(onErrorClear).not.toHaveBeenCalled();
});
