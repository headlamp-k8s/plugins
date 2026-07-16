import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { AIToolsSettings } from './AIToolsSettings';
import { emptyArgs, mixedArgs } from './AIToolsSettings.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

afterEach(cleanup);

it('renders host-provided tools with their enabled states and passes axe', async () => {
  render(
    <main>
      <AIToolsSettings {...mixedArgs} />
    </main>
  );

  expect(screen.getByRole('heading', { name: 'AI Tools', level: 2 })).toBeTruthy();
  expect(screen.getByText('Search the web for current information')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Enable or disable Web Search' })).toHaveProperty(
    'checked',
    true
  );
  expect(screen.getByRole('checkbox', { name: 'Enable or disable Code Execution' })).toHaveProperty(
    'checked',
    false
  );
  await expect(runAxe()).resolves.toEqual([]);
});

it('reports the exact tool identifier when toggled', () => {
  const onToolToggle = vi.fn();
  render(<AIToolsSettings {...mixedArgs} onToolToggle={onToolToggle} />);

  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable or disable File Reader' }));

  expect(onToolToggle).toHaveBeenCalledOnce();
  expect(onToolToggle).toHaveBeenCalledWith('file-read');
});

it('renders the translated empty state without switches', () => {
  render(<AIToolsSettings {...emptyArgs} />);

  expect(screen.getByText('No AI tools available.')).toBeTruthy();
  expect(screen.queryByRole('checkbox')).toBeNull();
});

it('forwards the translated title and children to a custom section wrapper', () => {
  const wrapper = vi.fn();
  function SectionWrapper({
    title,
    children,
  }: PropsWithChildren<{ title: string }>): React.ReactElement {
    wrapper(title);
    return <section aria-label={title}>{children}</section>;
  }
  render(<AIToolsSettings {...mixedArgs} SectionWrapper={SectionWrapper} />);

  expect(screen.getByRole('region', { name: 'AI Tools' })).toBeTruthy();
  expect(wrapper).toHaveBeenCalledWith('AI Tools');
});
