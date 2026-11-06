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
import {
  redactSecrets,
  redactSecretsInValue,
} from '@headlamp-k8s/ai-common/security/redactSecrets';

/**
 * Configuration options for generating an exported session report.
 */
export interface SessionExportOptions {
  /** The conversation messages to include in the exported report. */
  messages: ConversationMessage[];
  /** Optional single active cluster name associated with the conversation session. */
  cluster?: string;
  /** Optional list of selected cluster names associated with the conversation session. */
  clusters?: string[];
  /** Optional timestamp to record in the export header. Defaults to the current date and time. */
  timestamp?: Date;
}

/**
 * Normalized tool call representation extracted from raw tool execution data.
 */
interface ExtractedToolCall {
  /** The name of the tool called. */
  name: string;
  /** The arguments passed to the tool, parsed as an object if valid JSON. */
  args?: unknown;
}

/**
 * Extracts and normalizes tool call details from a raw tool call object.
 *
 * Supports both OpenAI/LangChain function-call representations (`{ function: { name, arguments } }`)
 * and direct tool-call representations (`{ name, args | arguments }`).
 *
 * @param raw - The raw tool call object or data structure from the message payload.
 * @returns The extracted tool call containing name and arguments, or null if the payload is invalid.
 */
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
 * Redacts sensitive credentials and secrets from an agent thinking or tool execution step text.
 *
 * If the step text matches a tool call output prefix (e.g. `🔧 tool_name: ...`),
 * attempts to parse and redact JSON payloads recursively while preserving prefix formatting.
 *
 * @param stepText - Raw step trace text to sanitize.
 * @returns Sanitized step trace text with secrets redacted.
 */
function redactStepText(stepText: string): string {
  const toolPrefixMatch = stepText.match(/^(\s*🔧\s*[^:]+:\s*)([\s\S]*)$/);
  if (toolPrefixMatch) {
    const [, prefix, rawPayload] = toolPrefixMatch;
    let payload = rawPayload.trim();
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed === 'object' && parsed !== null) {
        const redactedValue = redactSecretsInValue(parsed);
        if (JSON.stringify(parsed) !== JSON.stringify(redactedValue)) {
          payload = JSON.stringify(redactedValue, null, payload.includes('\n') ? 2 : undefined);
        }
      }
    } catch {
      // Not JSON
    }
    return `${prefix}${redactSecrets(payload)}`;
  }
  return redactSecrets(stepText);
}

/**
 * Determines whether a conversation message should be included in session exports.
 * Excludes internal system messages and non-content display-only placeholders.
 *
 * @param msg - The message to check.
 * @returns True if the message is exportable.
 */
export function isExportableMessage(msg: ConversationMessage): boolean {
  return !(
    msg.role === 'system' ||
    Boolean((msg as { isModelOnly?: boolean }).isModelOnly) ||
    (msg.role === 'tool' && msg.isDisplayOnly && !msg.content?.includes('LOGS_BUTTON:')) ||
    (msg.isDisplayOnly && !msg.content && !msg.toolCalls?.length && !msg.agentThinkingSteps?.length)
  );
}

interface LogsEnvelopePayload {
  logs: string;
  resourceName?: string;
  resourceType?: string;
  namespace?: string;
  containerName?: string;
}

/**
 * Parses the structured `LOGS_BUTTON:<json>\n\n<summary>` envelope, extracting
 * the logs payload and metadata while discarding the duplicated summary.
 *
 * @param content - Message content that may contain a logs button envelope.
 * @returns The extracted logs payload or null if the content is not a logs button envelope.
 */
export function parseLogsEnvelope(content: string): LogsEnvelopePayload | null {
  const marker = 'LOGS_BUTTON:';
  const idx = content.indexOf(marker);
  if (idx === -1) return null;

  const jsonStart = idx + marker.length;
  let braceCount = 0;
  let foundFirstBrace = false;
  let jsonString = '';
  let inString = false;
  let escaped = false;

  for (let i = jsonStart; i < content.length; i++) {
    const char = content[i];
    if (escaped) {
      escaped = false;
    } else if (char === '\\' && inString) {
      escaped = true;
    } else if (char === '"') {
      inString = !inString;
    } else if (!inString && char === '{') {
      foundFirstBrace = true;
      braceCount++;
    } else if (!inString && char === '}') {
      braceCount--;
    }

    if (foundFirstBrace) {
      jsonString += char;
      if (braceCount === 0) {
        break;
      }
    }
  }

  if (!jsonString) return null;

  try {
    const parsed = JSON.parse(jsonString);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.data &&
      typeof parsed.data.logs === 'string'
    ) {
      return {
        logs: parsed.data.logs,
        resourceName: parsed.data.resourceName,
        resourceType: parsed.data.resourceType,
        namespace: parsed.data.namespace,
        containerName: parsed.data.containerName,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Checks whether a conversation contains any messages suitable for session export.
 *
 * @param messages - The conversation messages to inspect.
 * @returns True if at least one exportable message is present.
 */
export function hasExportableMessages(messages?: ConversationMessage[]): boolean {
  return Boolean(messages && messages.some(isExportableMessage));
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

  const exportableMessages = messages.filter(isExportableMessage);

  const lines: string[] = [
    '# Headlamp AI Assistant Session Report',
    '',
    `- **Date:** ${dateString}`,
    `- **Cluster(s):** ${clusterList.join(', ')}`,
    `- **Total Messages:** ${exportableMessages.length}`,
    '',
    '---',
    '',
    '## Conversation History',
    '',
  ];

  if (exportableMessages.length === 0) {
    lines.push('_No messages in this session._', '');
  } else {
    for (const msg of exportableMessages) {
      const role = msg.role || 'unknown';
      let roleTitle = 'Message';
      if (role === 'user') {
        roleTitle = 'User';
      } else if (role === 'assistant') {
        roleTitle = 'AI Assistant';
      } else if (role === 'tool') {
        roleTitle = `Tool Result${msg.name ? ` (${msg.name})` : ''}`;
      }

      lines.push(`### ${roleTitle}`);
      lines.push('');

      const hasContent = Boolean(msg.content && msg.content.trim());
      const hasToolCalls = Boolean(
        msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0
      );
      const hasThinkingSteps = Boolean(msg.agentThinkingSteps && msg.agentThinkingSteps.length > 0);

      if (hasContent) {
        const contentToRedact = msg.content.trim();
        const logsPayload = parseLogsEnvelope(contentToRedact);
        if (logsPayload) {
          const redactedLogs = redactSecrets(logsPayload.logs);
          const header = [
            'Logs retrieved for',
            logsPayload.resourceType || 'resource',
            logsPayload.resourceName ? `"${logsPayload.resourceName}"` : '',
            logsPayload.namespace ? `in namespace "${logsPayload.namespace}"` : '',
            logsPayload.containerName ? `(container: ${logsPayload.containerName})` : '',
          ]
            .filter(Boolean)
            .join(' ');
          lines.push(`${header}:`);
          lines.push('');
          lines.push('```');
          lines.push(redactedLogs);
          lines.push('```');
          lines.push('');
        } else {
          let formattedContent = contentToRedact;
          try {
            const parsed = JSON.parse(formattedContent);
            if (typeof parsed === 'object' && parsed !== null) {
              const redactedValue = redactSecretsInValue(parsed);
              if (JSON.stringify(parsed) !== JSON.stringify(redactedValue)) {
                formattedContent = JSON.stringify(
                  redactedValue,
                  null,
                  formattedContent.includes('\n') ? 2 : undefined
                );
              }
            }
          } catch {
            // Preserve non-JSON content as is
          }
          lines.push(redactSecrets(formattedContent));
          lines.push('');
        }
      }

      // Serialize requested tool calls
      if (hasToolCalls && msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          const extracted = extractToolCall(tc);
          if (extracted) {
            lines.push(`**Requested Tool Call:** \`${extracted.name}\``);
            lines.push('');
            if (extracted.args !== undefined && extracted.args !== null) {
              const redactedArgs = redactSecretsInValue(extracted.args);
              const formattedArgs =
                typeof redactedArgs === 'string'
                  ? redactedArgs
                  : JSON.stringify(redactedArgs, null, 2);
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
            lines.push(`- ${redactStepText(stepText)}`);
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
