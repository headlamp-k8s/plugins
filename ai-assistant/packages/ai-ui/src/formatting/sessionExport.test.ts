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

import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { describe, expect, it } from 'vitest';
import {
  generateSessionMarkdown,
  hasExportableMessages,
  isExportableMessage,
} from './sessionExport';

describe('generateSessionMarkdown', () => {
  const fixedDate = new Date('2026-09-04T12:00:00.000Z');

  it('generates an empty session placeholder when no messages are provided', () => {
    const result = generateSessionMarkdown({
      messages: [],
      cluster: 'minikube',
      timestamp: fixedDate,
    });

    expect(result).toContain('# Headlamp AI Assistant Session Report');
    expect(result).toContain('- **Date:** 2026-09-04 12:00:00 UTC');
    expect(result).toContain('- **Cluster(s):** minikube');
    expect(result).toContain('- **Total Messages:** 0');
    expect(result).toContain('_No messages in this session._');
  });

  it('formats user and assistant conversation messages', () => {
    const result = generateSessionMarkdown({
      messages: [
        { role: 'user', content: 'Why is my pod crashing?' },
        { role: 'assistant', content: 'The pod is experiencing an OOMKilled error.' },
      ],
      clusters: ['cluster-a', 'cluster-b'],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Cluster(s):** cluster-a, cluster-b');
    expect(result).toContain('- **Total Messages:** 2');
    expect(result).toContain('### User');
    expect(result).toContain('Why is my pod crashing?');
    expect(result).toContain('### AI Assistant');
    expect(result).toContain('The pod is experiencing an OOMKilled error.');
  });

  it('prefers multi-cluster selection when both cluster and clusters are provided', () => {
    const result = generateSessionMarkdown({
      messages: [{ role: 'user', content: 'List deployments' }],
      cluster: 'active-cluster',
      clusters: ['cluster-alpha', 'cluster-beta'],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Cluster(s):** cluster-alpha, cluster-beta');
    expect(result).not.toContain('active-cluster');
  });

  it('formats tool results with tool name and error notes', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'tool',
          name: 'kubernetes_api_request',
          content: '{"error": "Forbidden"}',
          error: true,
        },
      ],
      cluster: 'prod-cluster',
      timestamp: fixedDate,
    });

    expect(result).toContain('### Tool Result (kubernetes_api_request)');
    expect(result).toContain('{"error": "Forbidden"}');
    expect(result).toContain('> This message encountered an error during execution.');
  });

  it('redacts tokens and credentials from message content', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'user',
          content:
            'Here is my token: ghp_123456789012345678901234567890 and password=superSecretPassword!',
        },
        {
          role: 'assistant',
          content:
            'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature',
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).not.toContain('ghp_123456789012345678901234567890');
    expect(result).not.toContain('superSecretPassword!');
    expect(result).not.toContain('doNotLeakThisSignature');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts Kubernetes Secret payloads in tool results and messages', () => {
    const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
data:
  password: c2VjcmV0LXBhc3M=
  DATABASE_URL: cG9zdGdyZXM6Ly9sb2NhbGhvc3Qv
`;
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'tool',
          name: 'get_secret',
          content: secretYaml,
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).not.toContain('c2VjcmV0LXBhc3M=');
    expect(result).not.toContain('cG9zdGdyZXM6Ly9sb2NhbGhvc3Qv');
    expect(result).toContain('password: [REDACTED]');
    expect(result).toContain('DATABASE_URL: [REDACTED]');
  });

  it('serializes requested tool calls with redacted arguments when content is empty', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'call_1',
              function: {
                name: 'kubectl_exec',
                arguments: JSON.stringify({
                  command: 'printenv',
                  token: 'ghp_abcdefghijklmnopqrstuvwxyz123456',
                }),
              },
            },
          ],
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('### AI Assistant');
    expect(result).toContain('**Requested Tool Call:** `kubectl_exec`');
    expect(result).toContain('"command": "printenv"');
    expect(result).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz123456');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts secret values inside JSON-string tool request bodies', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'call_secret_create',
              function: {
                name: 'kubernetes_api_request',
                arguments: JSON.stringify({
                  method: 'POST',
                  path: '/api/v1/namespaces/default/secrets',
                  body: JSON.stringify({
                    apiVersion: 'v1',
                    kind: 'Secret',
                    metadata: { name: 'session-secret' },
                    data: {
                      session: 'c2VjcmV0LXRva2VuLTEyMzQ1',
                    },
                  }),
                }),
              },
            },
          ],
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('**Requested Tool Call:** `kubernetes_api_request`');
    expect(result).not.toContain('c2VjcmV0LXRva2VuLTEyMzQ1');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts secret values inside string-valued Secret request body in tool error content', () => {
    const toolErrorJson = JSON.stringify({
      error: true,
      message: 'Failed to apply secret: admission webhook denied request',
      toolName: 'kubernetes_api_request',
      request: {
        method: 'POST',
        path: '/api/v1/namespaces/default/secrets',
        body: JSON.stringify({
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: { name: 'session-secret' },
          data: {
            session: 'c2VjcmV0LXRva2VuLTEyMzQ1',
          },
        }),
      },
      userFriendlyMessage:
        'Failed to execute kubernetes_api_request: Failed to apply secret: admission webhook denied request',
    });

    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'tool',
          name: 'kubernetes_api_request',
          content: toolErrorJson,
          error: true,
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('### Tool Result (kubernetes_api_request)');
    expect(result).not.toContain('c2VjcmV0LXRva2VuLTEyMzQ1');
    expect(result).toContain('[REDACTED]');
    expect(result).toContain('> This message encountered an error during execution.');
  });

  it('excludes display-only tool messages such as pending-confirmation placeholders', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'user',
          content: 'Delete namespace test-ns',
        },
        {
          role: 'assistant',
          content: 'I need confirmation to delete the namespace.',
          toolCalls: [
            {
              id: 'call_delete',
              function: {
                name: 'kubernetes_delete',
                arguments: '{"namespace":"test-ns"}',
              },
            },
          ],
        },
        {
          role: 'tool',
          name: 'kubernetes_delete',
          content: JSON.stringify({ status: 'awaiting_confirmation', method: 'DELETE' }),
          toolCallId: 'call_delete',
          isDisplayOnly: true,
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Total Messages:** 2');
    expect(result).toContain('### User');
    expect(result).toContain('### AI Assistant');
    expect(result).toContain('**Requested Tool Call:** `kubernetes_delete`');
    expect(result).not.toContain('awaiting_confirmation');
    expect(result).not.toContain('Tool Result (kubernetes_delete)');
  });

  it('renders no messages placeholder when all messages are display-only', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'tool',
          name: 'kubernetes_delete',
          content: JSON.stringify({ status: 'awaiting_confirmation' }),
          isDisplayOnly: true,
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Total Messages:** 0');
    expect(result).toContain('_No messages in this session._');
  });

  it('serializes agent thinking steps under agent activity with redactions', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'assistant',
          content: 'Investigated pod logs.',
          agentThinkingSteps: [
            {
              id: 'step-1',
              type: 'tool-start',
              content: 'Running diagnostic command with api_key=secret-key-12345',
              timestamp: 1234567,
            },
            {
              id: 'step-2',
              type: 'tool-result',
              content: 'Command completed successfully',
              timestamp: 1234568,
            },
          ],
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('**Agent Activity:**');
    expect(result).toContain('Running diagnostic command with api_key=[REDACTED]');
    expect(result).toContain('Command completed successfully');
    expect(result).not.toContain('secret-key-12345');
  });

  it('redacts unfenced secret payloads inside Holmes tool activity steps', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'assistant',
          content: 'Inspected secret.',
          agentThinkingSteps: [
            {
              id: 'step-1',
              type: 'tool-result',
              content: '🔧 kubectl result: {"kind":"Secret","data":{"session":"c2VjcmV0"}}',
              timestamp: 1234567,
            },
          ],
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('**Agent Activity:**');
    expect(result).toContain('🔧 kubectl result:');
    expect(result).not.toContain('c2VjcmV0');
    expect(result).toContain('[REDACTED]');
  });

  it('excludes internal system messages from exported reports', () => {
    const result = generateSessionMarkdown({
      messages: [
        { role: 'user', content: 'How do I inspect pods?' },
        {
          role: 'system',
          content:
            'REMINDER: Never suggest kubectl or command line tools. Always use the kubernetes_api_request tool or explain UI actions. The user is using a web dashboard and cannot access the command line.',
        },
        { role: 'assistant', content: 'You can inspect pods in the Workloads section.' },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Total Messages:** 2');
    expect(result).toContain('### User');
    expect(result).toContain('How do I inspect pods?');
    expect(result).toContain('### AI Assistant');
    expect(result).toContain('You can inspect pods in the Workloads section.');
    expect(result).not.toContain('REMINDER: Never suggest kubectl');
    expect(result).not.toContain('### System');
  });

  it('renders no messages placeholder when only system messages are present', () => {
    const result = generateSessionMarkdown({
      messages: [
        {
          role: 'system',
          content: 'REMINDER: Never suggest kubectl or command line tools.',
        },
      ],
      timestamp: fixedDate,
    });

    expect(result).toContain('- **Total Messages:** 0');
    expect(result).toContain('_No messages in this session._');
    expect(result).not.toContain('REMINDER');
    expect(result).not.toContain('### System');
  });

  describe('isExportableMessage and hasExportableMessages', () => {
    it('returns false when history is empty or contains only system messages', () => {
      expect(hasExportableMessages([])).toBe(false);
      expect(hasExportableMessages(undefined)).toBe(false);
      expect(
        hasExportableMessages([
          {
            role: 'system',
            content: 'Switched to provider Ollama with model llama3.',
          },
        ])
      ).toBe(false);
      expect(
        isExportableMessage({
          role: 'system',
          content: 'Switched to provider Ollama.',
        })
      ).toBe(false);
    });

    it('returns false for display-only messages lacking content and tool calls', () => {
      const displayOnlyTool: ConversationMessage = {
        role: 'tool',
        name: 'kubernetes_delete',
        content: '{"status":"awaiting_confirmation"}',
        isDisplayOnly: true,
      };
      const displayOnlyPlaceholder: ConversationMessage = {
        role: 'assistant',
        content: '',
        isDisplayOnly: true,
      };

      expect(isExportableMessage(displayOnlyTool)).toBe(false);
      expect(isExportableMessage(displayOnlyPlaceholder)).toBe(false);
      expect(hasExportableMessages([displayOnlyTool, displayOnlyPlaceholder])).toBe(false);
    });

    it('returns true when valid user, assistant, or executed tool messages are present', () => {
      expect(
        hasExportableMessages([
          { role: 'system', content: 'Status message' },
          { role: 'user', content: 'How do I check pods?' },
        ])
      ).toBe(true);

      expect(
        hasExportableMessages([
          {
            role: 'assistant',
            content: '',
            toolCalls: [{ name: 'get_pods', arguments: '{}' }],
          },
        ])
      ).toBe(true);

      expect(
        hasExportableMessages([
          {
            role: 'assistant',
            content: '',
            agentThinkingSteps: [
              { id: '1', type: 'tool-start', content: 'Inspecting pods', timestamp: 1234567 },
            ],
          },
        ])
      ).toBe(true);
    });
  });
});
