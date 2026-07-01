#!/usr/bin/env node

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

/**
 * headlamp-ai CLI — thin entry point.
 *
 * Business logic lives in sibling modules:
 *   config.ts  — CLIConfig, Headlamp data-dir helpers, env/file loading
 *   model.ts   — model creation, Copilot sentinel resolution
 *   mcp.ts     — MCP tool initialisation
 *   chat.ts    — query() and interactiveMode()
 *   args.ts    — CLI argument parsing and usage text
 */

import * as path from 'path';
import { parseArgs, printUsage, readStdin } from './args.js';
import { createManager, interactiveMode, query } from './chat.js';
import {
  type CLIConfig,
  configFromEnv,
  getHeadlampDataDir,
  loadAppConfig,
  loadConfigFile,
  saveHeadlampAIConfig,
} from './config.js';
import { makeNodeCommandRunner, runAutoDetect, tryAutoDetectCopilot } from './model.js';

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  // --auto-detect: discover available providers and optionally save the best one
  if (parsed.autoDetect) {
    console.error('Detecting available AI providers...\n');
    const found = await runAutoDetect();
    if (found.length === 0) {
      console.log(
        'No providers detected.\n' +
          '  - Install `gh` and run `gh auth login` for GitHub Copilot\n' +
          '  - Run Ollama locally for local models\n' +
          '  - Log in with `az login` for Azure OpenAI'
      );
      process.exit(0);
    }
    console.log(`Detected ${found.length} provider(s):\n`);
    found.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.displayName}  (via ${p.source})`);
      if (p.config.model) console.log(`     model: ${p.config.model}`);
    });
    if (parsed.save) {
      const best = found[0];
      const savedPath = saveHeadlampAIConfig({ provider: best.providerId, config: best.config });
      console.log(`\nSaved "${best.displayName}" to ${savedPath}`);
    } else {
      console.log('\nRun with --save to write the first provider to headlamp-ai.json');
    }
    process.exit(0);
  }

  const dataDir = getHeadlampDataDir();
  const appConfigPath = path.join(dataDir, 'headlamp-ai.json');

  let config: CLIConfig | null = null;

  const configFilePath = parsed.configPath || process.env.HEADLAMP_AI_CONFIG;
  if (configFilePath) {
    try {
      config = loadConfigFile(configFilePath);
    } catch (err: any) {
      console.error(`Error loading config file: ${err.message}`);
      process.exit(1);
    }
  }

  if (!config) config = configFromEnv();
  if (!config) {
    config = loadAppConfig();
    if (config) console.error(`Using config from ${appConfigPath}`);
  }

  // Apply CLI flag overrides
  if (parsed.provider) {
    config ??= { provider: parsed.provider, config: {} };
    config.provider = parsed.provider;
  }
  if (parsed.model) {
    config ??= { provider: 'openai', config: {} };
    config.config.model = parsed.model;
  }
  if (parsed.apiKey) {
    config ??= { provider: 'openai', config: {} };
    config.config.apiKey = parsed.apiKey;
  }
  if (parsed.baseUrl) {
    config ??= { provider: 'local', config: {} };
    config.config.baseUrl = parsed.baseUrl;
  }
  if (parsed.endpoint) {
    config ??= { provider: 'azure', config: {} };
    config.config.endpoint = parsed.endpoint;
  }
  if (parsed.deploymentName) {
    config ??= { provider: 'azure', config: {} };
    config.config.deploymentName = parsed.deploymentName;
  }

  if (!config?.provider) {
    const detected = await tryAutoDetectCopilot();
    if (detected) {
      console.error(`Auto-detected ${detected.displayName} via ${detected.source}.`);
      config = { provider: detected.providerId, config: detected.config };
    }
  }

  if (!config?.provider) {
    console.error(
      `Error: No AI provider configured.\nUse --provider, --config, or HEADLAMP_AI_PROVIDER.\nConfig path: ${appConfigPath}\nRun --help for usage.`
    );
    process.exit(1);
  }

  // Resolve the API key (e.g. GH_CLI_AUTH_SENTINEL → real token)
  const resolvedConfig = { ...config.config };
  if (config.provider === 'copilot') {
    const { GH_CLI_AUTH_SENTINEL, detectGitHubToken } = await import(
      '@headlamp-k8s/ai-common/providers/providerAutoDetect'
    );
    if (resolvedConfig.apiKey === GH_CLI_AUTH_SENTINEL) {
      const token = await detectGitHubToken(makeNodeCommandRunner());
      if (!token) {
        console.error('Failed to get GitHub token via `gh auth token`.');
        process.exit(1);
      }
      resolvedConfig.apiKey = token;
    }
  }

  // Create a LangChainManager — same code path as the Headlamp UI.
  const manager = await createManager(config.provider, resolvedConfig, {
    allowMutations: parsed.allowMutations,
    skillSources: parsed.skillSources,
  });

  if (parsed.interactive) {
    await interactiveMode(manager);
    return;
  }

  let userQuery = parsed.query;
  if (!userQuery && !process.stdin.isTTY) userQuery = await readStdin();
  if (!userQuery) {
    console.error(
      'Error: No query provided. Use --interactive or pipe from stdin. Run --help for usage.'
    );
    process.exit(1);
  }

  try {
    console.log(await query(manager, userQuery));
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
