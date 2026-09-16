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
});
