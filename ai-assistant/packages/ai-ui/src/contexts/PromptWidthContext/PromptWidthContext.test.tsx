import { act, render, renderHook, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';
import { runAxe } from '../../testing/runAxe';
import { PromptWidthProvider, usePromptWidth } from './PromptWidthContext';
import { promptWidthStoryInitialWidth } from './PromptWidthContext.stories';

function storyWrapper({ children }: PropsWithChildren): React.ReactElement {
  return (
    <PromptWidthProvider initialWidth={promptWidthStoryInitialWidth}>
      {children}
    </PromptWidthProvider>
  );
}

function WidthReader(): React.ReactElement {
  const { promptWidth } = usePromptWidth();
  return <output>{promptWidth}</output>;
}

it('provides the default width when no initial value is supplied', () => {
  const { result } = renderHook(() => usePromptWidth(), {
    wrapper: PromptWidthProvider,
  });

  expect(result.current.promptWidth).toBe('400px');
});

it('reuses the Storybook initial width and updates it', () => {
  const { result } = renderHook(() => usePromptWidth(), { wrapper: storyWrapper });
  expect(result.current.promptWidth).toBe(promptWidthStoryInitialWidth);

  act(() => result.current.setPromptWidth('80vw'));

  expect(result.current.promptWidth).toBe('80vw');
});

it('synchronizes when the host width changes', async () => {
  const { rerender } = render(
    <PromptWidthProvider initialWidth="320px">
      <WidthReader />
    </PromptWidthProvider>
  );
  expect(screen.getByText('320px')).toBeTruthy();

  rerender(
    <PromptWidthProvider initialWidth="640px">
      <WidthReader />
    </PromptWidthProvider>
  );

  expect(await screen.findByText('640px')).toBeTruthy();
});

it('throws a developer invariant outside the provider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const preventExpectedError = (event: ErrorEvent): void => event.preventDefault();
  window.addEventListener('error', preventExpectedError);

  try {
    expect(() => renderHook(() => usePromptWidth())).toThrow(
      'usePromptWidth must be used within a PromptWidthProvider'
    );
  } finally {
    window.removeEventListener('error', preventExpectedError);
  }
});

it('renders accessible children without changing their semantics', async () => {
  render(
    <main>
      <PromptWidthProvider>
        <button type="button">Resize prompt</button>
      </PromptWidthProvider>
    </main>
  );

  expect(screen.getByRole('button', { name: 'Resize prompt' })).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});
