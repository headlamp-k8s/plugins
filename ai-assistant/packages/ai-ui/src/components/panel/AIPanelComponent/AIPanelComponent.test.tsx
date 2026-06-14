import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePromptWidth } from '../../../contexts/PromptWidthContext/PromptWidthContext';
import { runAxe } from '../../../testing/runAxe';
import AIPanelComponent from './AIPanelComponent';
import { closedPanelArgs, openPanelArgs } from './AIPanelComponent.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1000,
  });
});

afterEach(cleanup);

function WidthProbe(): React.ReactElement {
  const { promptWidth } = usePromptWidth();
  return <output aria-label="Prompt width">{promptWidth}</output>;
}

it('renders nothing while closed', () => {
  const { container } = render(<AIPanelComponent {...closedPanelArgs} />);
  expect(container.childElementCount).toBe(0);
});

it('renders safely without a browser viewport', () => {
  vi.stubGlobal('window', undefined);
  expect(() => renderToString(<AIPanelComponent {...openPanelArgs} />)).not.toThrow();
  vi.unstubAllGlobals();
});

it('renders a labeled panel and separator with valid configuration content and passes axe', async () => {
  render(
    <main>
      <AIPanelComponent {...openPanelArgs} clusterNotifier={<p>Cluster changed</p>}>
        <WidthProbe />
      </AIPanelComponent>
    </main>
  );

  expect(screen.getByRole('complementary', { name: 'AI Assistant panel' })).toBeTruthy();
  expect(screen.getByText('Cluster changed')).toBeTruthy();
  expect(screen.getByRole('separator', { name: 'Resize AI Assistant panel' })).toHaveProperty(
    'tabIndex',
    0
  );
  expect(screen.getByRole('status', { name: 'Prompt width' }).textContent).toBe('35vw');
  await expect(runAxe()).resolves.toEqual([]);
});

it('hides the cluster notifier without a valid configuration', () => {
  render(
    <AIPanelComponent
      {...openPanelArgs}
      hasValidConfig={false}
      clusterNotifier={<p>Cluster changed</p>}
    />
  );
  expect(screen.queryByText('Cluster changed')).toBeNull();
});

it('resizes by keyboard and exposes current separator values', () => {
  render(
    <AIPanelComponent {...openPanelArgs}>
      <WidthProbe />
    </AIPanelComponent>
  );
  const separator = screen.getByRole('separator', { name: 'Resize AI Assistant panel' });
  const width = screen.getByRole('status', { name: 'Prompt width' });

  expect(separator.getAttribute('aria-valuenow')).toBe('350');
  fireEvent.keyDown(separator, { key: 'ArrowLeft' });
  expect(width.textContent).toBe('370px');
  fireEvent.keyDown(separator, { key: 'ArrowRight' });
  expect(width.textContent).toBe('350px');
  fireEvent.keyDown(separator, { key: 'Home' });
  expect(width.textContent).toBe('300px');
  fireEvent.keyDown(separator, { key: 'End' });
  expect(width.textContent).toBe('800px');
  expect(separator.getAttribute('aria-valuenow')).toBe('800');
  expect(separator.getAttribute('aria-valuemax')).toBe('800');
});

it('ignores unrelated keys', () => {
  render(
    <AIPanelComponent {...openPanelArgs}>
      <WidthProbe />
    </AIPanelComponent>
  );
  const separator = screen.getByRole('separator', { name: 'Resize AI Assistant panel' });

  fireEvent.keyDown(separator, { key: 'Enter' });
  expect(screen.getByRole('status', { name: 'Prompt width' }).textContent).toBe('35vw');
});

it('constrains pointer resizing and stops after mouse release', () => {
  render(
    <AIPanelComponent {...openPanelArgs}>
      <WidthProbe />
    </AIPanelComponent>
  );
  const separator = screen.getByRole('separator', { name: 'Resize AI Assistant panel' });
  const width = screen.getByRole('status', { name: 'Prompt width' });

  fireEvent.mouseDown(separator);
  fireEvent.mouseMove(document, { clientX: 0 });
  expect(width.textContent).toBe('800px');
  fireEvent.mouseUp(document);
  fireEvent.mouseMove(document, { clientX: 700 });
  expect(width.textContent).toBe('800px');
});

it('clamps a pixel-sized panel when the viewport shrinks', () => {
  render(
    <AIPanelComponent {...openPanelArgs}>
      <WidthProbe />
    </AIPanelComponent>
  );
  fireEvent.keyDown(screen.getByRole('separator'), { key: 'End' });
  expect(screen.getByRole('status', { name: 'Prompt width' }).textContent).toBe('800px');

  window.innerWidth = 500;
  fireEvent(window, new Event('resize'));
  expect(screen.getByRole('status', { name: 'Prompt width' }).textContent).toBe('400px');
});
