import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import HolmesSetupGuide from './HolmesSetupGuide';

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

it('focuses and labels the setup region and passes axe', async () => {
  render(
    <main>
      <HolmesSetupGuide
        onOpenSettings={vi.fn()}
        namespace="monitoring"
        serviceName="holmes"
        port={8080}
      />
    </main>
  );
  const heading = screen.getByRole('heading', { name: 'Set up HolmesGPT in your cluster' });
  expect(document.activeElement).toBe(heading);
  expect(screen.getByRole('region', { name: 'Set up HolmesGPT in your cluster' })).toBeTruthy();
  expect(screen.getByText('Namespace: monitoring')).toBeTruthy();
  expect(screen.getByText('Service: holmes')).toBeTruthy();
  expect(screen.getByText('Port: 8080')).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('wires actions and exposes retry progress', () => {
  const onOpenSettings = vi.fn();
  const onRetry = vi.fn();
  const onDismiss = vi.fn();
  const { rerender } = render(
    <HolmesSetupGuide
      onOpenSettings={onOpenSettings}
      onRetry={onRetry}
      onDismiss={onDismiss}
      docsUrl="https://example.test/install"
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configure in Settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back to AI Chat' }));
  expect(onOpenSettings).toHaveBeenCalledOnce();
  expect(onRetry).toHaveBeenCalledOnce();
  expect(onDismiss).toHaveBeenCalledOnce();
  expect(screen.getByRole('link', { name: 'HolmesGPT install guide' })).toHaveProperty(
    'rel',
    'noopener noreferrer'
  );

  rerender(<HolmesSetupGuide onOpenSettings={onOpenSettings} onRetry={onRetry} isRetrying />);
  const retry = screen.getByRole<HTMLButtonElement>('button', { name: 'Retrying…' });
  expect(retry.disabled).toBe(true);
  expect(retry.getAttribute('aria-busy')).toBe('true');
});
