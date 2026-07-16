import {
  AZ_CLI_AUTH_SENTINEL,
  GH_CLI_AUTH_SENTINEL,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import type { ProviderSettings } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { describe, expect, it, vi } from 'vitest';
import { resolveRuntimeProviderConfig } from './resolveRuntimeProviderConfig';

const commandRunner = vi.fn(async () => ({ stdout: '', exitCode: 0 }));

describe('resolveRuntimeProviderConfig', () => {
  it('resolves GitHub credentials only in the runtime clone', async () => {
    const persisted = Object.freeze<ProviderSettings>({
      apiKey: GH_CLI_AUTH_SENTINEL,
      model: 'gpt-4o',
    });
    const serializedBefore = JSON.stringify(persisted);
    const runtime = await resolveRuntimeProviderConfig(persisted, {
      commandRunner,
      refreshGitHubToken: vi.fn().mockResolvedValue('real-github-token'),
      refreshAzureOpenAIKey: vi.fn(),
    });

    expect(runtime.apiKey).toBe('real-github-token');
    expect(runtime).not.toBe(persisted);
    expect(persisted.apiKey).toBe(GH_CLI_AUTH_SENTINEL);
    expect(JSON.stringify(persisted)).toBe(serializedBefore);
  });

  it('resolves Azure credentials only in the runtime clone', async () => {
    const persisted = Object.freeze<ProviderSettings>({
      apiKey: AZ_CLI_AUTH_SENTINEL,
      azResourceGroup: 'resource-group',
      azAccountName: 'account',
      model: 'deployment',
    });
    const serializedBefore = JSON.stringify(persisted);
    const runtime = await resolveRuntimeProviderConfig(persisted, {
      commandRunner,
      refreshGitHubToken: vi.fn(),
      refreshAzureOpenAIKey: vi.fn().mockResolvedValue('real-azure-key'),
    });

    expect(runtime.apiKey).toBe('real-azure-key');
    expect(persisted.apiKey).toBe(AZ_CLI_AUTH_SENTINEL);
    expect(JSON.stringify(persisted)).toBe(serializedBefore);
  });

  it('fails without exposing or changing the persisted sentinel config', async () => {
    const persisted = Object.freeze<ProviderSettings>({ apiKey: GH_CLI_AUTH_SENTINEL });
    await expect(
      resolveRuntimeProviderConfig(persisted, {
        commandRunner: null,
        refreshGitHubToken: vi.fn(),
        refreshAzureOpenAIKey: vi.fn(),
      })
    ).rejects.toThrow('Could not resolve the GitHub Copilot token');
    expect(persisted.apiKey).toBe(GH_CLI_AUTH_SENTINEL);
  });
});
