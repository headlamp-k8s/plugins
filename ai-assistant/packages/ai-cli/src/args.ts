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

import * as path from 'path';
import { getHeadlampDataDir } from './config.js';

export interface ParsedArgs {
  configPath?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  endpoint?: string;
  deploymentName?: string;
  systemPrompt?: string;
  interactive: boolean;
  autoDetect: boolean;
  allowMutations: boolean;
  /** Auto-approve all tool calls without prompting. */
  autoApprove: boolean;
  save: boolean;
  help: boolean;
  query: string;
  /** Git repo URLs to load skills from (repeatable). */
  skillSources: string[];
  /** When true, inject a built-in mock skill set instead of loading from Git. */
  mockSkills: boolean;
  /** When true, inject a MockToolManager with canned Kubernetes fixture data. */
  mockTools: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    interactive: false,
    autoDetect: false,
    allowMutations: false,
    autoApprove: process.env.HEADLAMP_AI_AUTO_APPROVE === '1' || process.env.HEADLAMP_AI_MOCK_ALL === '1',
    save: false,
    help: false,
    query: '',
    skillSources: [],
    mockSkills: process.env.HEADLAMP_AI_MOCK_SKILLS === '1' || process.env.HEADLAMP_AI_MOCK_ALL === '1',
    mockTools: process.env.HEADLAMP_AI_MOCK_TOOLS === '1' || process.env.HEADLAMP_AI_MOCK_ALL === '1',
  };
  const args = argv.slice(2);
  const queryParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
        result.configPath = args[++i];
        break;
      case '--provider':
        result.provider = args[++i];
        break;
      case '--model':
        result.model = args[++i];
        break;
      case '--api-key':
        result.apiKey = args[++i];
        break;
      case '--base-url':
        result.baseUrl = args[++i];
        break;
      case '--endpoint':
        result.endpoint = args[++i];
        break;
      case '--deployment-name':
        result.deploymentName = args[++i];
        break;
      case '--system-prompt':
        result.systemPrompt = args[++i];
        break;
      case '--skill-source':
        result.skillSources.push(args[++i]);
        break;
      case '--mock-skills':
        result.mockSkills = true;
        break;
      case '--mock-tools':
        result.mockTools = true;
        break;
      case '--interactive':
      case '-i':
        result.interactive = true;
        break;
      case '--auto-detect':
      case '--autodetect':
        result.autoDetect = true;
        break;
      case '--allow-mutations':
        result.allowMutations = true;
        break;
      case '--auto-approve':
        result.autoApprove = true;
        break;
      case '--save':
        result.save = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (!args[i].startsWith('--')) queryParts.push(args[i]);
    }
  }

  result.query = queryParts.join(' ');
  return result;
}

export function printUsage(): void {
  const dataDir = getHeadlampDataDir();
  console.log(`headlamp-ai - CLI for Headlamp AI assistant

Usage:
  headlamp-ai [options] [query]

Options:
  --config <path>       Path to config JSON file
  --provider <id>       Provider: openai, anthropic, gemini, mistral, deepseek, copilot, local, mock-testing-model
  --model <name>        Model name (e.g. gpt-4o, claude-sonnet-4-6)
  --api-key <key>       API key for the provider
  --base-url <url>      Base URL for local/custom providers
  --system-prompt <p>   Custom system prompt
  --interactive, -i     Start interactive chat session
  --skill-source <url>  Git repo URL to load skills from (repeatable, e.g. https://github.com/microsoft/azure-skills)
  --mock-skills         Inject a built-in mock skill set (no network). Env: HEADLAMP_AI_MOCK_SKILLS=1
  --mock-tools          Inject mock Kubernetes tool results (no cluster). Env: HEADLAMP_AI_MOCK_TOOLS=1
  --allow-mutations     Allow mutating kubectl operations (POST, PUT, DELETE, PATCH). Default: read-only
  --auto-approve        Auto-approve all tool calls without prompting. Env: HEADLAMP_AI_AUTO_APPROVE=1
  --auto-detect         Detect available AI providers (Copilot, Azure, Ollama)
  --save                With --auto-detect: save the first detected provider to headlamp-ai.json
  --help, -h            Show this help message

Auto-discovered config paths (same as Headlamp app):
  ${path.join(dataDir, 'headlamp-ai.json')}     AI provider config
  ${path.join(dataDir, 'mcp-tools-settings.json')}   MCP server settings

Environment variables:
  HEADLAMP_AI_PROVIDER        Provider ID
  HEADLAMP_AI_MODEL           Model name
  HEADLAMP_AI_API_KEY         API key
  HEADLAMP_AI_BASE_URL        Base URL for local models
  HEADLAMP_AI_CONFIG          Path to config file
  HEADLAMP_AI_ENDPOINT        Azure endpoint
  HEADLAMP_AI_DEPLOYMENT_NAME Azure deployment name
  HEADLAMP_AI_AUTO_APPROVE    Set to 1 to auto-approve all tool calls
  HEADLAMP_AI_MOCK_SKILLS     Set to 1 to inject the built-in mock skill set
  HEADLAMP_AI_MOCK_TOOLS      Set to 1 to inject mock Kubernetes tool results
  HEADLAMP_AI_MOCK_ALL        Set to 1 to enable full offline/demo mode:
                              mock model + mock skills + mock tools + auto-approve

Examples:
  headlamp-ai --provider openai --api-key sk-... "What is a Pod?"
  headlamp-ai --config ./ai-config.json "Explain services"
  headlamp-ai -i --provider anthropic --api-key sk-ant-...
  echo "List resources" | headlamp-ai --config ./config.json`);
}

export async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}
