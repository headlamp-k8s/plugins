/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createChatModel } from '@headlamp-k8s/ai-common/providers/createChatModel';
import {
  type CommandRunner,
  detectCopilotProvider,
  type DetectedProvider,
  detectGitHubToken,
  detectProviders,
  GH_CLI_AUTH_SENTINEL,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { execFileSync } from 'child_process';

/** Creates a Node.js CommandRunner backed by execFileSync (for ai-common APIs). */
export function makeNodeCommandRunner(): CommandRunner {
  return async (command: string, args: string[]) => {
    try {
      const stdout = execFileSync(command, args, {
        encoding: 'utf-8',
        timeout: 15_000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { stdout, exitCode: 0 };
    } catch (err: unknown) {
      const commandError = err as { stdout?: unknown; status?: number };
      return {
        stdout: commandError.stdout ? String(commandError.stdout) : '',
        exitCode: commandError.status ?? 1,
      };
    }
  };
}

/**
 * Creates a LangChain model for the given provider and config.
 * Resolves the GH_CLI_AUTH_SENTINEL by running `gh auth token` via the shared
 * detectGitHubToken helper from ai-common.
 */
export async function createModel(
  providerId: string,
  config: Record<string, any>
): Promise<BaseChatModel> {
  let resolvedConfig = config;

  if (providerId === 'copilot' && config.apiKey === GH_CLI_AUTH_SENTINEL) {
    const token = await detectGitHubToken(makeNodeCommandRunner());
    if (!token) {
      throw new Error(
        'Failed to get GitHub token via `gh auth token`. ' +
          'Run `gh auth login` or set HEADLAMP_AI_API_KEY.'
      );
    }
    resolvedConfig = { ...config, apiKey: token };
  }

  return createChatModel(providerId, resolvedConfig);
}

/**
 * Tries to auto-detect a Copilot provider using the full flow from ai-common:
 * gh auth token → validate → fetch Copilot model catalog → pick best model.
 */
export async function tryAutoDetectCopilot(): Promise<DetectedProvider | null> {
  return detectCopilotProvider(makeNodeCommandRunner());
}

/**
 * Runs all provider auto-detection (Copilot, Azure CLI, Ollama).
 * Skips providers already in existingProviders.
 */
export async function runAutoDetect(
  existingProviders: Array<{ providerId: string; config: Record<string, any> }> = []
): Promise<DetectedProvider[]> {
  return detectProviders(existingProviders, [], makeNodeCommandRunner());
}
