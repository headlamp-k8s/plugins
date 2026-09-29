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

import { describe, expect, it } from 'vitest';
import { generateSessionMarkdown } from './sessionExport';

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

  it('serializes executed tool calls with redacted arguments when content is empty', () => {
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
    expect(result).toContain('**Executed Tool Call:** `kubectl_exec`');
    expect(result).toContain('"command": "printenv"');
    expect(result).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz123456');
    expect(result).toContain('[REDACTED]');
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
});
