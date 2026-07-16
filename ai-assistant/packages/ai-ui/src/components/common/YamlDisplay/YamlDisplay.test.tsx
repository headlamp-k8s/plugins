import { createTheme, ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import YamlDisplay from './YamlDisplay';
import { deploymentYaml, deploymentYamlArgs, invalidYamlArgs } from './YamlDisplay.stories';

const editorProps = vi.hoisted(() => vi.fn());
const editorInstance = vi.hoisted(() => ({ layout: vi.fn() }));

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    editorProps(props);
    return <pre data-testid="yaml-editor">{String(props.value ?? '')}</pre>;
  },
}));

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

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('formats YAML, displays metadata, opens the editor, and passes axe', async () => {
  const onOpenInEditor = vi.fn();
  render(
    <main>
      <YamlDisplay {...deploymentYamlArgs} onOpenInEditor={onOpenInEditor} />
    </main>
  );
  const formatted = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3`;

  expect(screen.getByText('Deployment: nginx-deployment')).toBeTruthy();
  expect(screen.getByTestId('yaml-editor').textContent).toBe(formatted);
  expect(screen.getByRole('region', { name: 'YAML preview for Deployment' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Open In Editor' }));
  expect(onOpenInEditor).toHaveBeenCalledWith(formatted, 'Deployment', 'Apply Deployment');
  await expect(runAxe()).resolves.toEqual([]);
});

it('uses the latest callback after rerender', () => {
  const first = vi.fn();
  const second = vi.fn();
  const { rerender } = render(<YamlDisplay yaml={deploymentYaml} onOpenInEditor={first} />);
  rerender(<YamlDisplay yaml={deploymentYaml} onOpenInEditor={second} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open In Editor' }));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith(expect.any(String), 'Deployment', 'Apply Deployment');
});

it('renders translated fallback metadata and hides an unavailable action', () => {
  render(<YamlDisplay {...invalidYamlArgs} />);
  expect(screen.getByText('Resource')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'YAML preview for Resource' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open In Editor' })).toBeNull();
});

it('selects the editor theme from MUI mode', () => {
  const { rerender } = render(<YamlDisplay {...deploymentYamlArgs} />);
  expect(editorProps).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'light' }));
  rerender(
    <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
      <YamlDisplay {...deploymentYamlArgs} />
    </ThemeProvider>
  );
  expect(editorProps).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'vs-dark' }));
});

it('removes decorative horizontal separators without changing YAML indentation', () => {
  render(
    <YamlDisplay
      yaml={`────
  apiVersion: v1
  kind: ConfigMap
────`}
    />
  );
  expect(screen.getByTestId('yaml-editor').textContent).toBe('apiVersion: v1\nkind: ConfigMap');
});

it('lays out Monaco on resize and cleans timers and observers', () => {
  vi.useFakeTimers();
  const observe = vi.fn();
  const disconnect = vi.fn();
  let resize: () => void = () => undefined;
  class MockResizeObserver {
    constructor(callback: () => void) {
      resize = callback;
    }
    observe = observe;
    disconnect = disconnect;
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  const { unmount } = render(<YamlDisplay {...deploymentYamlArgs} />);
  const mount = editorProps.mock.lastCall?.[0].onMount as (editor: typeof editorInstance) => void;
  act(() => mount(editorInstance));
  Object.defineProperty(screen.getByRole('region'), 'offsetWidth', {
    configurable: true,
    value: 120,
  });

  act(() => resize());
  act(() => resize());
  expect(editorInstance.layout).toHaveBeenCalledWith({ width: 0, height: 250 });
  act(() => vi.advanceTimersByTime(100));
  expect(editorInstance.layout).toHaveBeenCalledWith({ width: 100, height: 250 });
  expect(observe).toHaveBeenCalled();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it('renders without ResizeObserver support', () => {
  vi.stubGlobal('ResizeObserver', undefined);
  expect(() => render(<YamlDisplay {...deploymentYamlArgs} />)).not.toThrow();
  const mount = editorProps.mock.lastCall?.[0].onMount as (editor: typeof editorInstance) => void;
  expect(() => act(() => mount(editorInstance))).not.toThrow();
});
