import type { SavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAxe } from '../../../testing/runAxe';
import {
  addMockModelProvider,
  DeveloperSettings,
  hasMockModelProvider,
  removeMockModelProvider,
} from './DeveloperSettings';
import { allDisabledArgs, allEnabledArgs, mockModelOnlyArgs } from './DeveloperSettings.stories';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const configsWithoutMock: SavedConfigurations = {
  providers: [
    {
      providerId: 'openai',
      displayName: 'OpenAI',
      config: { apiKey: 'sk-test', model: 'gpt-4o' },
    },
    {
      providerId: 'copilot',
      displayName: 'GitHub Copilot',
      config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
    },
  ],
  defaultProviderIndex: 0,
  termsAccepted: true,
};

const configsWithMock: SavedConfigurations = {
  providers: [
    ...(configsWithoutMock.providers ?? []),
    {
      providerId: 'mock-testing-model',
      displayName: 'Mock Testing Model',
      config: {},
    },
  ],
  defaultProviderIndex: 2,
  termsAccepted: true,
};

afterEach(cleanup);

describe('DeveloperSettings helpers', () => {
  it('detects the mock provider across absent and populated configurations', () => {
    expect(hasMockModelProvider(undefined)).toBe(false);
    expect(hasMockModelProvider(null)).toBe(false);
    expect(hasMockModelProvider({})).toBe(false);
    expect(hasMockModelProvider(configsWithoutMock)).toBe(false);
    expect(hasMockModelProvider(configsWithMock)).toBe(true);
  });

  it('adds the mock provider without changing terms acceptance', () => {
    const result = addMockModelProvider(undefined);

    expect(result).toEqual({
      providers: [
        {
          providerId: 'mock-testing-model',
          displayName: 'Mock Testing Model',
          config: {},
        },
      ],
      defaultProviderIndex: 0,
    });
  });

  it('adds the mock provider after existing providers and makes it default', () => {
    const result = addMockModelProvider(configsWithoutMock);

    expect(result.providers).toHaveLength(3);
    expect(result.defaultProviderIndex).toBe(2);
    expect(configsWithoutMock.providers).toHaveLength(2);
  });

  it('does not duplicate an existing mock provider and makes it default', () => {
    const configs = { ...configsWithMock, defaultProviderIndex: 0 };
    const result = addMockModelProvider(configs);

    expect(
      result.providers?.filter(provider => provider.providerId === 'mock-testing-model')
    ).toHaveLength(1);
    expect(result.defaultProviderIndex).toBe(2);
  });

  it('removes the mock provider and clears an empty default', () => {
    const result = removeMockModelProvider({
      providers: [{ providerId: 'mock-testing-model', config: {} }],
      defaultProviderIndex: 0,
    });

    expect(result.providers).toEqual([]);
    expect(result.defaultProviderIndex).toBeUndefined();
  });

  it('selects the first remaining provider when the mock was default', () => {
    const result = removeMockModelProvider({
      providers: [
        { providerId: 'openai', config: { apiKey: 'key' } },
        { providerId: 'mock-testing-model', config: {} },
        { providerId: 'copilot', config: { apiKey: 'token' } },
      ],
      defaultProviderIndex: 1,
    });

    expect(result.providers?.map(provider => provider.providerId)).toEqual(['openai', 'copilot']);
    expect(result.defaultProviderIndex).toBe(0);
  });

  it('decrements a later default when the removed mock precedes it', () => {
    const result = removeMockModelProvider({
      providers: [
        { providerId: 'mock-testing-model', config: {} },
        { providerId: 'openai', config: { apiKey: 'key' } },
        { providerId: 'copilot', config: { apiKey: 'token' } },
      ],
      defaultProviderIndex: 2,
    });

    expect(result.defaultProviderIndex).toBe(1);
  });

  it('preserves a later default when removing multiple preceding mock providers', () => {
    const result = removeMockModelProvider({
      providers: [
        { providerId: 'mock-testing-model', config: {} },
        { providerId: 'mock-testing-model', config: {} },
        { providerId: 'openai', config: { apiKey: 'key' } },
      ],
      defaultProviderIndex: 2,
    });

    expect(result.providers?.map(provider => provider.providerId)).toEqual(['openai']);
    expect(result.defaultProviderIndex).toBe(0);
  });

  it('preserves the default when no mock provider exists', () => {
    const result = removeMockModelProvider(configsWithoutMock);

    expect(result.providers).toEqual(configsWithoutMock.providers);
    expect(result.defaultProviderIndex).toBe(0);
  });

  it('preserves an earlier default when removing a later mock provider', () => {
    const result = removeMockModelProvider({
      providers: [
        { providerId: 'openai', config: { apiKey: 'key' } },
        { providerId: 'copilot', config: { apiKey: 'token' } },
        { providerId: 'mock-testing-model', config: {} },
      ],
      defaultProviderIndex: 1,
    });

    expect(result.defaultProviderIndex).toBe(1);
  });
});

describe('DeveloperSettings component', () => {
  it('renders the collapsed disabled story with an accessible toggle', async () => {
    render(<DeveloperSettings {...allDisabledArgs} />);

    const toggle = screen.getByRole('button', { name: 'Developer Options' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('checkbox')).toBeNull();
    await expect(runAxe()).resolves.toEqual([]);
  });

  it('expands and collapses using the real header button', () => {
    render(<DeveloperSettings {...allDisabledArgs} />);
    const toggle = screen.getByRole('button', { name: 'Developer Options' });

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders the enabled story expanded and passes axe', async () => {
    render(
      <main>
        <DeveloperSettings {...allEnabledArgs} />
      </main>
    );

    expect(
      screen.getByRole('button', { name: 'Developer Options' }).getAttribute('aria-expanded')
    ).toBe('true');
    expect(
      screen.getAllByRole<HTMLInputElement>('checkbox').every(checkbox => checkbox.checked)
    ).toBe(true);
    await expect(runAxe()).resolves.toEqual([]);
  });

  it.each([
    ['Mock Testing Agent', 'enableMockAgent'],
    ['Fake MCP Server', 'enableFakeMCP'],
    ['Auto-approve Tool Calls', 'enableAutoApproval'],
    ['Mock Testing Tools', 'enableMockTools'],
  ] as const)('reports %s changes', (label, key) => {
    const onDevOptionsChange = vi.fn();
    render(
      <DeveloperSettings
        {...allEnabledArgs}
        devOptions={{}}
        onDevOptionsChange={onDevOptionsChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Developer Options' }));

    fireEvent.click(screen.getByRole('checkbox', { name: label }));

    expect(onDevOptionsChange).toHaveBeenCalledWith({ [key]: true });
  });

  it('adds the mock provider even when saved configs are omitted', () => {
    const onDevOptionsChange = vi.fn();
    const onConfigsChange = vi.fn();
    render(
      <DeveloperSettings
        devOptions={{}}
        onDevOptionsChange={onDevOptionsChange}
        onConfigsChange={onConfigsChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Developer Options' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mock Testing Model' }));

    expect(onDevOptionsChange).toHaveBeenCalledWith({ enableMockModel: true });
    expect(onConfigsChange).toHaveBeenCalledWith(
      expect.objectContaining({ defaultProviderIndex: 0 })
    );
    expect(onConfigsChange.mock.calls[0][0].termsAccepted).toBeUndefined();
  });

  it('removes the mock provider when disabling the mock-only story', () => {
    const onConfigsChange = vi.fn();
    const onDevOptionsChange = vi.fn();
    render(
      <DeveloperSettings
        {...mockModelOnlyArgs}
        onConfigsChange={onConfigsChange}
        onDevOptionsChange={onDevOptionsChange}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mock Testing Model' }));

    expect(onConfigsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: [expect.objectContaining({ providerId: 'openai' })],
        defaultProviderIndex: 0,
      })
    );
    expect(onDevOptionsChange).toHaveBeenCalledOnce();
    expect(onDevOptionsChange).toHaveBeenCalledWith({ enableMockModel: false });
    expect(onConfigsChange.mock.invocationCallOrder[0]).toBeLessThan(
      onDevOptionsChange.mock.invocationCallOrder[0]
    );
  });

  it('changes mock model state without a config callback', () => {
    const onDevOptionsChange = vi.fn();
    render(
      <DeveloperSettings
        devOptions={{ enableMockModel: true }}
        onDevOptionsChange={onDevOptionsChange}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mock Testing Model' }));

    expect(onDevOptionsChange).toHaveBeenCalledWith({ enableMockModel: false });
  });
});
