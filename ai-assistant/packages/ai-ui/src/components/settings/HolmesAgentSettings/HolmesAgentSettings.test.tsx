import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import { HolmesAgentSettings } from './HolmesAgentSettings';
import {
  configuredHolmesArgs,
  customHolmesDefaultsArgs,
  defaultHolmesArgs,
} from './HolmesAgentSettings.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options[name] ?? ''))
        : key,
  }),
}));

afterEach(cleanup);

function expectInputValue(role: 'textbox' | 'spinbutton', name: string, value: string): void {
  expect(screen.getByRole<HTMLInputElement>(role, { name }).value).toBe(value);
}

it('renders built-in defaults for absent config and passes axe', async () => {
  render(
    <main>
      <HolmesAgentSettings {...defaultHolmesArgs} />
    </main>
  );

  expectInputValue('textbox', 'Namespace', 'default');
  expectInputValue('textbox', 'Service name', 'holmesgpt-holmes');
  expectInputValue('spinbutton', 'Port', '80');
  expect(screen.getByText(/Kubernetes API service proxy/)).toBeTruthy();
  await expect(runAxe()).resolves.toEqual([]);
});

it('renders configured Storybook values after trimming persisted text', () => {
  render(
    <HolmesAgentSettings
      {...configuredHolmesArgs}
      config={{
        holmesNamespace: '  observability  ',
        holmesServiceName: '  holmesgpt  ',
        holmesPort: 8080,
      }}
    />
  );

  expectInputValue('textbox', 'Namespace', 'observability');
  expectInputValue('textbox', 'Service name', 'holmesgpt');
  expectInputValue('spinbutton', 'Port', '8080');
});

it('falls back safely for malformed persisted configuration', () => {
  const { rerender } = render(<HolmesAgentSettings {...defaultHolmesArgs} config="invalid" />);
  expectInputValue('textbox', 'Namespace', 'default');

  rerender(
    <HolmesAgentSettings
      {...defaultHolmesArgs}
      config={{ holmesNamespace: 4, holmesServiceName: [], holmesPort: '8080' }}
    />
  );
  expectInputValue('textbox', 'Namespace', 'default');
  expectInputValue('textbox', 'Service name', 'holmesgpt-holmes');
  expectInputValue('spinbutton', 'Port', '80');
});

it('uses custom defaults in values and translated helper guidance', () => {
  render(<HolmesAgentSettings {...customHolmesDefaultsArgs} />);

  expectInputValue('textbox', 'Namespace', 'ai-tools');
  expectInputValue('textbox', 'Service name', 'holmes-proxy');
  expectInputValue('spinbutton', 'Port', '8081');
  expect(
    screen.getByText('Namespace where HolmesGPT is deployed (default: "ai-tools")')
  ).toBeTruthy();
  expect(screen.getByText('Service port (default: 8081)')).toBeTruthy();
});

it('falls back to the built-in port when a host default is invalid', () => {
  render(<HolmesAgentSettings {...customHolmesDefaultsArgs} defaultPort={0} />);

  expectInputValue('spinbutton', 'Port', '80');
  expect(screen.getByText('Service port (default: 80)')).toBeTruthy();
});

it('reports trimmed namespace and service changes with configured fallbacks', () => {
  const onConfigChange = vi.fn();
  render(<HolmesAgentSettings {...customHolmesDefaultsArgs} onConfigChange={onConfigChange} />);

  fireEvent.change(screen.getByRole('textbox', { name: 'Namespace' }), {
    target: { value: '  production  ' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Service name' }), {
    target: { value: '   ' },
  });

  expect(onConfigChange).toHaveBeenNthCalledWith(1, { holmesNamespace: 'production' });
  expect(onConfigChange).toHaveBeenNthCalledWith(2, { holmesServiceName: 'holmes-proxy' });
});

it('persists a valid port on blur', () => {
  const onConfigChange = vi.fn();
  render(<HolmesAgentSettings {...customHolmesDefaultsArgs} onConfigChange={onConfigChange} />);
  const port = screen.getByRole('spinbutton', { name: 'Port' });

  fireEvent.change(port, { target: { value: '8082' } });
  expect(onConfigChange).not.toHaveBeenCalled();
  fireEvent.blur(port);
  expect(onConfigChange).toHaveBeenCalledWith({ holmesPort: 8082 });
});

it.each(['', '1.5', '0', '65536'] as const)(
  'shows an accessible error for invalid port input %s and restores the default on blur',
  value => {
    const onConfigChange = vi.fn();
    render(<HolmesAgentSettings {...customHolmesDefaultsArgs} onConfigChange={onConfigChange} />);
    const port = screen.getByRole('spinbutton', { name: 'Port' });

    fireEvent.change(port, { target: { value } });
    expect(port.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a whole-number port between 1 and 65535.')).toBeTruthy();
    expect(onConfigChange).not.toHaveBeenCalled();

    fireEvent.blur(port);
    expect(onConfigChange).toHaveBeenCalledWith({ holmesPort: 8081 });
    expectInputValue('spinbutton', 'Port', '8081');
  }
);
