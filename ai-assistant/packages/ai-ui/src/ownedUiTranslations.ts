/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TFunction } from 'i18next';

export function translateProviderDescription(
  t: TFunction,
  providerId: string,
  fallback: string
): string {
  switch (providerId) {
    case 'copilot':
      return t('Integration with GitHub Copilot via GitHub CLI authentication');
    case 'openai':
      return t('Integration with OpenAI API (GPT models)');
    case 'azure':
      return t('Integration with Azure OpenAI Service');
    case 'anthropic':
      return t('Integration with Anthropic Claude models');
    case 'mistral':
      return t('Integration with Mistral AI models');
    case 'gemini':
      return t('Integration with Google Gemini models');
    case 'deepseek':
      return t('Integration with DeepSeek models');
    case 'vllm':
      return t('Integration with vLLM or any OpenAI-compatible endpoint');
    case 'local':
      return t('Integration with locally hosted models (Ollama or similar)');
    case 'mock-testing-model':
      return t(
        'A canned-response model for automated tests, CI, and scripted demos — no API key or network required'
      );
    default:
      return fallback;
  }
}

export function translateProviderFieldLabel(
  t: TFunction,
  providerId: string,
  fieldName: string,
  fallback: string
): string {
  switch (`${providerId}.${fieldName}`) {
    case 'copilot.apiKey':
      return t('GitHub Token');
    case 'azure.endpoint':
      return t('Endpoint');
    case 'azure.deploymentName':
      return t('Deployment Name');
    case 'vllm.baseUrl':
    case 'local.baseUrl':
      return t('Base URL');
    case 'mock-testing-model.fixturesDir':
      return t('Custom Fixtures Directory');
    case 'mock-testing-model.sequenceName':
      return t('Demo Sequence');
    default:
      if (fieldName === 'apiKey') return t('API Key');
      if (fieldName === 'model') return t('Model');
      return fallback;
  }
}

export function translateProviderFieldPlaceholder(
  t: TFunction,
  providerId: string,
  fieldName: string,
  fallback: string
): string {
  switch (`${providerId}.${fieldName}`) {
    case 'copilot.apiKey':
      return t('ghp_... or use Auto Detect');
    case 'azure.apiKey':
      return t('Your Azure OpenAI API key');
    case 'azure.deploymentName':
      return t('Your deployment name');
    case 'mistral.apiKey':
      return t('Your Mistral API key');
    case 'gemini.apiKey':
      return t('Your Google API key');
    case 'deepseek.apiKey':
      return t('Your DeepSeek API key');
    case 'vllm.apiKey':
      return t('sk-noop (leave blank if vLLM has no auth)');
    case 'local.apiKey':
      return t('Your Local Model API key');
    default:
      return fallback;
  }
}

export function translateProviderFieldDescription(
  t: TFunction,
  providerId: string,
  fieldName: string,
  fallback: string
): string {
  switch (`${providerId}.${fieldName}`) {
    case 'copilot.apiKey':
      return t('GitHub personal access token. Use Auto Detect to authenticate via the gh CLI.');
    case 'azure.endpoint':
      return t(
        'The base URL of your Azure OpenAI resource (e.g. https://your-resource.openai.azure.com). Do NOT include any path like /openai/v1/chat/completions.'
      );
    case 'azure.deploymentName':
      return t('The name of your model deployment in Azure');
    case 'azure.model':
      return t('The model used by your Azure OpenAI deployment');
    case 'vllm.baseUrl':
      return t('Full URL including /v1 — e.g. http://host:8000/v1');
    case 'vllm.model':
      return t('Must match --served-model-name passed to vLLM');
    case 'mock-testing-model.fixturesDir':
      return t('Optional path to a directory of extra .json fixture files');
    case 'mock-testing-model.sequenceName':
      return t(
        'Name of a conversation sequence to play back in order (leave empty for template matching)'
      );
    default:
      return fallback;
  }
}

export function translateSkillDirectoryLabel(t: TFunction, path: string, fallback: string): string {
  switch (path) {
    case '.github/skills':
      return t('GitHub Copilot Skills');
    case '.github/instructions':
      return t('GitHub Copilot Instructions');
    case '.claude/skills':
      return t('Claude Code Skills');
    case 'skills':
      return t('Generic Skills');
    default:
      return fallback;
  }
}

export function translateSkillRepositoryDescription(
  t: TFunction,
  url: string,
  fallback: string
): string {
  switch (url) {
    case 'https://github.com/kubeshark/kubeshark':
      return t('Network traffic analysis for Kubernetes');
    case 'https://github.com/helmfile/helmfile':
      return t('Declarative Helm chart deployment');
    case 'https://github.com/openshift/lightspeed-service':
      return t('Kubernetes/OpenShift troubleshooting skills');
    case 'https://github.com/microsoft/azure-skills':
      return t('Azure service guidance (AKS, networking, etc.)');
    case 'https://github.com/fluxcd/agent-skills':
      return t('GitOps knowledge, manifest generation, cluster debugging');
    case 'https://github.com/MicrosoftDocs/Agent-Skills':
      return t('Azure cloud development skills from Microsoft Docs');
    case 'https://github.com/kubernetes/website':
      return t('Official Kubernetes documentation (subset)');
    default:
      return fallback;
  }
}
