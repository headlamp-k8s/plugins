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

it('inserts a reviewable draft without an adjacent immediate-send action and passes axe', async () => {
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
  const suggestion = defaultPromptSuggestionsArgs.suggestions[0];

  fireEvent.click(screen.getByRole('button', { name: suggestion.label }));

  expect(onPromptSelect).toHaveBeenCalledWith(suggestion);
  expect(onPromptSend).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /Send suggestion/ })).toBeNull();
  expect(onErrorClear).not.toHaveBeenCalled();
  await expect(runAxe()).resolves.toEqual([]);
});

it('clears content-filter errors before inserting a suggestion for review', () => {
  const calls: string[] = [];
  const suggestion = contentFilterErrorArgs.suggestions[1];
  render(
    <PromptSuggestions
      {...contentFilterErrorArgs}
      apiError="Blocked by Content Filter policy"
      onErrorClear={() => calls.push('clear')}
      onPromptSelect={selected => calls.push(`select:${selected.prompt}`)}
    />
  );

  expect(screen.getByText('Try one of these safe Kubernetes questions instead:')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: suggestion.label }));
  expect(calls).toEqual(['clear', `select:${suggestion.prompt}`]);
});

it('does not show filter guidance or clear unrelated API errors', () => {
  const onErrorClear = vi.fn();
  const suggestion = defaultPromptSuggestionsArgs.suggestions[0];
  render(
    <PromptSuggestions
      {...defaultPromptSuggestionsArgs}
      apiError="Network unavailable"
      onErrorClear={onErrorClear}
    />
  );

  expect(screen.queryByText('Try one of these safe Kubernetes questions instead:')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: suggestion.label }));
  expect(onErrorClear).not.toHaveBeenCalled();
});
