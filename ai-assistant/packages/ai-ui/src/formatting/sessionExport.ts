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
import { redactSecrets } from '@headlamp-k8s/ai-common/security/redactSecrets';

export interface SessionExportOptions {
  messages: ConversationMessage[];
  cluster?: string;
  clusters?: string[];
  timestamp?: Date;
}

interface ExtractedToolCall {
  name: string;
  args?: unknown;
}

function extractToolCall(raw: unknown): ExtractedToolCall | null {
  if (!raw || typeof raw !== 'object') return null;
  const tc = raw as Record<string, unknown>;

  if (tc.function && typeof tc.function === 'object') {
    const fn = tc.function as Record<string, unknown>;
    const name = typeof fn.name === 'string' ? fn.name : 'unknown_tool';
    let args = fn.arguments;
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        // Keep string if not valid JSON
      }
    }
    return { name, args };
  }

  if (typeof tc.name === 'string') {
    let args = tc.arguments ?? tc.args;
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        // Keep string if not valid JSON
      }
    }
    return { name: tc.name, args };
  }

  return null;
}

/**
 * Generates a structured Markdown report from an assistant conversation session.
 * Redacts secrets from messages, tool calls, and activity traces.
 *
 * @param options - Session export configuration including messages and cluster metadata.
 * @returns Clean, formatted Markdown content suitable for issue attachments or incident logs.
 */
export function generateSessionMarkdown(options: SessionExportOptions): string {
  const { messages, cluster, clusters, timestamp = new Date() } = options;

  // Prefer the selected list when non-empty, then fall back to single active cluster
  const clusterList = clusters && clusters.length > 0 ? clusters : cluster ? [cluster] : ['N/A'];

  const dateString = timestamp.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const lines: string[] = [
    '# Headlamp AI Assistant Session Report',
    '',
    `- **Date:** ${dateString}`,
    `- **Cluster(s):** ${clusterList.join(', ')}`,
    `- **Total Messages:** ${messages.length}`,
    '',
    '---',
    '',
    '## Conversation History',
    '',
  ];

  if (messages.length === 0) {
    lines.push('_No messages in this session._', '');
  } else {
    for (const msg of messages) {
      if (
        msg.isDisplayOnly &&
        !msg.content &&
        !msg.toolCalls?.length &&
        !msg.agentThinkingSteps?.length
      ) {
        continue;
      }

      const role = msg.role || 'unknown';
      let roleTitle = 'Message';
      if (role === 'user') {
        roleTitle = 'User';
      } else if (role === 'assistant') {
        roleTitle = 'AI Assistant';
      } else if (role === 'tool') {
        roleTitle = `Tool Result${msg.name ? ` (${msg.name})` : ''}`;
      } else if (role === 'system') {
        roleTitle = 'System';
      }

      lines.push(`### ${roleTitle}`);
      lines.push('');

      const hasContent = Boolean(msg.content && msg.content.trim());
      const hasToolCalls = Boolean(
        msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0
      );
      const hasThinkingSteps = Boolean(msg.agentThinkingSteps && msg.agentThinkingSteps.length > 0);

      if (hasContent) {
        lines.push(redactSecrets(msg.content.trim()));
        lines.push('');
      }

      // Serialize executed tool calls
      if (hasToolCalls && msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          const extracted = extractToolCall(tc);
          if (extracted) {
            lines.push(`**Executed Tool Call:** \`${extracted.name}\``);
            lines.push('');
            if (extracted.args !== undefined && extracted.args !== null) {
              const formattedArgs =
                typeof extracted.args === 'string'
                  ? extracted.args
                  : JSON.stringify(extracted.args, null, 2);
              lines.push('```json');
              lines.push(redactSecrets(formattedArgs.trim()));
              lines.push('```');
              lines.push('');
            }
          }
        }
      }

      // Serialize agent activity / thinking steps
      if (hasThinkingSteps && msg.agentThinkingSteps) {
        lines.push('**Agent Activity:**');
        lines.push('');
        for (const step of msg.agentThinkingSteps) {
          const stepText = (
            step.content ??
            (step as unknown as { label?: string }).label ??
            ''
          ).trim();
          if (stepText) {
            lines.push(`- ${redactSecrets(stepText)}`);
          }
        }
        lines.push('');
      }

      if (!hasContent && !hasToolCalls && !hasThinkingSteps && !msg.error) {
        lines.push('_No content._');
        lines.push('');
      }

      if (msg.error) {
        lines.push('> [!NOTE]');
        lines.push('> This message encountered an error during execution.');
        lines.push('');
      }

      lines.push('---', '');
    }
  }

  lines.push('*Report generated by Headlamp AI Assistant*');

  return lines.join('\n');
}
