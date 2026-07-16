import {
  AZ_CLI_AUTH_SENTINEL,
  type CommandRunner,
  GH_CLI_AUTH_SENTINEL,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import type { ProviderSettings } from '@headlamp-k8s/ai-common/providers/savedConfigs';

/** Dependencies used to resolve CLI-backed provider credentials at runtime. */
export interface RuntimeCredentialResolver {
  /** Runs local CLI commands in the desktop app. */
  commandRunner: CommandRunner | null;
  /** Resolves a GitHub CLI sentinel to an access token. */
  refreshGitHubToken: (runner: CommandRunner) => Promise<string | null>;
  /** Resolves an Azure CLI sentinel to an OpenAI key. */
  refreshAzureOpenAIKey: (
    resourceGroup: string,
    accountName: string,
    runner: CommandRunner
  ) => Promise<string | null>;
}

/**
 * Creates an ephemeral provider config with CLI sentinel credentials resolved.
 *
 * The persisted input is never mutated; only the returned clone may contain a
 * real credential and that clone must be passed directly to model creation.
 *
 * @param persistedConfig - Saved provider config containing sentinels, not real CLI credentials.
 * @param resolver - Desktop command runner and credential refresh functions.
 * @returns Runtime-only config suitable for model construction.
 */
export async function resolveRuntimeProviderConfig(
  persistedConfig: Readonly<ProviderSettings>,
  resolver: RuntimeCredentialResolver
): Promise<ProviderSettings> {
  const runtimeConfig: ProviderSettings = { ...persistedConfig };
  if (runtimeConfig.apiKey === GH_CLI_AUTH_SENTINEL) {
    const freshToken = resolver.commandRunner
      ? await resolver.refreshGitHubToken(resolver.commandRunner)
      : null;
    if (!freshToken) {
      throw new Error(
        'Could not resolve the GitHub Copilot token from the GitHub CLI. ' +
          'Ensure the `gh` CLI is installed and authenticated (run `gh auth login`), ' +
          'then try again from the desktop app.'
      );
    }
    runtimeConfig.apiKey = freshToken;
  }

  if (runtimeConfig.apiKey === AZ_CLI_AUTH_SENTINEL) {
    const resourceGroup = runtimeConfig.azResourceGroup;
    const accountName = runtimeConfig.azAccountName;
    const freshKey =
      resolver.commandRunner &&
      typeof resourceGroup === 'string' &&
      typeof accountName === 'string' &&
      resourceGroup &&
      accountName
        ? await resolver.refreshAzureOpenAIKey(resourceGroup, accountName, resolver.commandRunner)
        : null;
    if (!freshKey) {
      throw new Error(
        'Could not resolve the Azure OpenAI key from the Azure CLI. ' +
          'Ensure the `az` CLI is installed and logged in (run `az login`), ' +
          'then try again from the desktop app.'
      );
    }
    runtimeConfig.apiKey = freshKey;
  }

  return runtimeConfig;
}
