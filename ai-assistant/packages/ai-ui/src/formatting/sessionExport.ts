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

const SECRET_URL_REGEX =
  /(?:^|\/)api\/v1\/(?:namespaces\/[^/]+\/)?secrets(?:\/[^/?#]+)?(?:[/?#]|$)/i;

/**
 * Checks if a URL or path targets a Kubernetes Secret resource.
 */
function isSecretRequestUrl(url: unknown): boolean {
  return typeof url === 'string' && SECRET_URL_REGEX.test(url);
}

/**
 * Replaces every value in a plain object map with `[REDACTED]`.
 */
function redactAllMapValues(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}

/**
 * Redacts all entries under `data` and `stringData` in a Secret body object.
 */
function redactSecretDataAndStringData(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  for (const field of ['data', 'stringData'] as const) {
    const bag = result[field];
    if (bag && typeof bag === 'object' && !Array.isArray(bag)) {
      result[field] = redactAllMapValues(bag as Record<string, unknown>);
    } else if (bag !== undefined && bag !== null) {
      result[field] = '[REDACTED]';
    }
  }
  if (Array.isArray(result.items)) {
    result.items = result.items.map(item =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? redactSecretDataAndStringData(item as Record<string, unknown>)
        : item
    );
  }
  return result;
}

/**
 * Sanitizes a single item inside a Secret mutation body array (e.g. an RFC 6902
 * JSON Patch operation or an array of Secret objects), preserving array shape.
 */
function sanitizeSecretBodyArrayItem(item: unknown): unknown {
  if (Array.isArray(item)) {
    return item.map(sanitizeSecretBodyArrayItem);
  }
  if (item && typeof item === 'object') {
    const clone: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    if ('value' in clone && clone.value !== null && clone.value !== undefined) {
      const patchPath = typeof clone.path === 'string' ? clone.path : '';
      if (/^\/(?:data|stringData)(?:\/|$)/i.test(patchPath)) {
        if (typeof clone.value === 'object' && !Array.isArray(clone.value)) {
          clone.value = redactAllMapValues(clone.value as Record<string, unknown>);
        } else {
          clone.value = '[REDACTED]';
        }
      } else if (
        typeof clone.value === 'object' &&
        !Array.isArray(clone.value) &&
        ('data' in (clone.value as Record<string, unknown>) ||
          'stringData' in (clone.value as Record<string, unknown>))
      ) {
        clone.value = redactSecretDataAndStringData(clone.value as Record<string, unknown>);
      } else {
        clone.value = '[REDACTED]';
      }
    }
    return redactSecretDataAndStringData(clone);
  }
  if (item !== null && item !== undefined) {
    return '[REDACTED]';
  }
  return item;
}

/**
 * Sanitizes a Secret mutation body, which may be a raw JSON/YAML string, a JSON
 * Patch array, or an object, without altering array vs. object shapes.
 */
function sanitizeSecretMutationBody(body: unknown): unknown {
  if (typeof body === 'string') {
    if (body.trim() === '') {
      return body;
    }
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map(sanitizeSecretBodyArrayItem);
        return JSON.stringify(sanitized, null, body.includes('\n') ? 2 : undefined);
      }
      if (parsed && typeof parsed === 'object') {
        const sanitized = redactSecretDataAndStringData(parsed as Record<string, unknown>);
        return JSON.stringify(sanitized, null, body.includes('\n') ? 2 : undefined);
      }
      if (parsed !== null && parsed !== undefined) {
        return '[REDACTED]';
      }
      return body;
    } catch {
      // Conservatively redact any non-JSON body (such as YAML PUT/PATCH payloads)
      // once the request URL identifies a Kubernetes Secret.
      return '[REDACTED]';
    }
  }
  if (Array.isArray(body)) {
    return body.map(sanitizeSecretBodyArrayItem);
  }
  if (body && typeof body === 'object') {
    return redactSecretDataAndStringData(body as Record<string, unknown>);
  }
  return body;
}

/**
 * Scans markdown content for fenced JSON code blocks and applies request-aware
 * secret sanitization to embedded JSON payloads while preserving surrounding prose.
 * Accepts indented opening/closing fences, longer closing fences, and trailing whitespace.
 *
 * @param content - Markdown text containing prose and optional fenced code blocks.
 * @returns The markdown text with credentials inside JSON code blocks sanitized.
 */
function sanitizeJsonCodeBlocksInMarkdown(content: string): string {
  const openFenceRegex = /(^|\r?\n)([ ]{0,3})(?:(`{3,})([^`\r\n]*)|(~{3,})([^~\r\n]*))\r?\n/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = openFenceRegex.exec(content)) !== null) {
    const [fullOpen, prefix, openIndent] = match;
    const openFence = match[3] ?? match[5];
    const lang = match[4] ?? match[6] ?? '';
    const fenceChar = openFence[0];
    const minFenceLen = openFence.length;
    const openStartIndex = match.index;
    const codeStart = openStartIndex + fullOpen.length;

    const fenceCharEscaped = fenceChar === '`' ? '`' : '~';
    const closeFenceRegex = new RegExp(
      '(\\r?\\n)([ ]{0,3})(' + fenceCharEscaped + '{' + minFenceLen + ',})([ \\t]*)(?=\\r?\\n|$)',
      'g'
    );
    closeFenceRegex.lastIndex = codeStart;
    const closeMatch = closeFenceRegex.exec(content);

    if (!closeMatch) {
      continue;
    }

    const codeEnd = closeMatch.index;
    const code = content.slice(codeStart, codeEnd);
    const [fullClose, , closeIndent, closeFence, closeTrailing] = closeMatch;
    const closeEnd = closeMatch.index + fullClose.length;

    result += content.slice(lastIndex, openStartIndex);

    const trimmedCode = code.trim();
    let replacedBlock: string | null = null;

    if (trimmedCode.startsWith('{') || trimmedCode.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmedCode);
        if (typeof parsed === 'object' && parsed !== null) {
          const sanitized = sanitizeSecretMutations(parsed);
          const redacted = redactSecretsInValue(sanitized);
          if (JSON.stringify(parsed) !== JSON.stringify(redacted)) {
            let reFormatted = JSON.stringify(redacted, null, code.includes('\n') ? 2 : undefined);
            if (openIndent) {
              reFormatted = reFormatted
                .split('\n')
                .map(line => `${openIndent}${line}`)
                .join('\n');
            }
            replacedBlock = `${prefix}${openIndent}${openFence}${lang}\n${reFormatted}\n${closeIndent}${closeFence}${closeTrailing}`;
          }
        }
      } catch {
        // Not valid JSON in code block, leave unchanged
      }
    }

    if (replacedBlock !== null) {
      result += replacedBlock;
    } else {
      result += content.slice(openStartIndex, closeEnd);
    }

    lastIndex = closeEnd;
    openFenceRegex.lastIndex = closeEnd;
  }

  result += content.slice(lastIndex);
  return result;
}

/**
 * Recursively scans and sanitizes partial or complete Secret mutation payloads
 * across tool call arguments, request envelopes, and message content.
 */
function sanitizeSecretMutations(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        const sanitized = sanitizeSecretMutations(parsed);
        if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
          return JSON.stringify(sanitized, null, value.includes('\n') ? 2 : undefined);
        }
      }
    } catch {
      return sanitizeJsonCodeBlocksInMarkdown(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeSecretMutations);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const record: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  const targetUrl = record.url ?? record.path;

  if (isSecretRequestUrl(targetUrl)) {
    if ('body' in record) {
      record.body = sanitizeSecretMutationBody(record.body);
    }
    if ('fullResource' in record) {
      record.fullResource = sanitizeSecretMutationBody(record.fullResource);
    }
    if ('data' in record || 'stringData' in record) {
      Object.assign(record, redactSecretDataAndStringData(record));
    }
  }

  if (record.request && typeof record.request === 'object' && !Array.isArray(record.request)) {
    const req = { ...(record.request as Record<string, unknown>) };
    const reqUrl = req.url ?? req.path;
    if (isSecretRequestUrl(reqUrl)) {
      if ('body' in req) {
        req.body = sanitizeSecretMutationBody(req.body);
      }
      if ('fullResource' in req) {
        req.fullResource = sanitizeSecretMutationBody(req.fullResource);
      }
      if ('data' in req || 'stringData' in req) {
        Object.assign(req, redactSecretDataAndStringData(req));
      }
      record.request = req;
    }
  }

  for (const [k, v] of Object.entries(record)) {
    if (k !== 'body' && k !== 'fullResource') {
      if ((typeof v === 'object' && v !== null) || typeof v === 'string') {
        record[k] = sanitizeSecretMutations(v);
      }
    }
  }

  return record;
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
    return { name, args: sanitizeSecretMutations(args) };
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
    return { name: tc.name, args: sanitizeSecretMutations(args) };
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
        const sanitized = sanitizeSecretMutations(parsed);
        const redactedValue = redactSecretsInValue(sanitized);
        if (JSON.stringify(parsed) !== JSON.stringify(redactedValue)) {
          payload = JSON.stringify(redactedValue, null, payload.includes('\n') ? 2 : undefined);
        }
      }
    } catch {
      payload = sanitizeJsonCodeBlocksInMarkdown(payload);
    }
    return `${prefix}${redactSecrets(payload)}`;
  }
  return redactSecrets(sanitizeJsonCodeBlocksInMarkdown(stepText));
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
  startIndex?: number;
  endIndex?: number;
}

/**
 * Parses the structured `LOGS_BUTTON:<json>\n\n<summary>` envelope, extracting
 * the logs payload and metadata while recording the envelope boundaries.
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
  let endIndex = -1;

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
        endIndex = i + 1;
        break;
      }
    }
  }

  if (!jsonString || endIndex === -1) return null;

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
        startIndex: idx,
        endIndex,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Generates a Markdown code fence of backticks strictly longer than any sequence
 * of consecutive backticks occurring in the content, with a minimum of 3 backticks.
 *
 * @param content - The text to be enclosed within a code block.
 * @returns A string of backticks (e.g. "```", "````", etc.).
 */
function getMarkdownCodeFence(content: string): string {
  const matches = content.match(/`+/g);
  let maxBackticks = 2;
  if (matches) {
    for (const match of matches) {
      if (match.length > maxBackticks) {
        maxBackticks = match.length;
      }
    }
  }
  return '`'.repeat(maxBackticks + 1);
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

      if (role === 'tool' && msg.cluster) {
        lines.push(`**Cluster:** \`${msg.cluster}\``);
        lines.push('');
      }

      const hasContent = Boolean(msg.content && msg.content.trim());
      const hasToolCalls = Boolean(
        msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0
      );
      const hasThinkingSteps = Boolean(msg.agentThinkingSteps && msg.agentThinkingSteps.length > 0);

      /**
       * Formats message prose by parsing and sanitizing JSON payloads,
       * sanitizing markdown-embedded JSON code blocks, and redacting secret tokens.
       */
      function formatMessageContent(content: string): string {
        let formattedContent = content;
        try {
          const parsed = JSON.parse(formattedContent);
          if (typeof parsed === 'object' && parsed !== null) {
            const sanitizedParsed = sanitizeSecretMutations(parsed);
            const redactedValue = redactSecretsInValue(sanitizedParsed);
            if (JSON.stringify(parsed) !== JSON.stringify(redactedValue)) {
              formattedContent = JSON.stringify(
                redactedValue,
                null,
                formattedContent.includes('\n') ? 2 : undefined
              );
            }
          }
        } catch {
          formattedContent = sanitizeJsonCodeBlocksInMarkdown(formattedContent);
        }
        return redactSecrets(formattedContent);
      }

      if (hasContent) {
        const contentToRedact = msg.content.trim();
        const logsPayload = parseLogsEnvelope(contentToRedact);
        if (
          logsPayload &&
          logsPayload.startIndex !== undefined &&
          logsPayload.endIndex !== undefined
        ) {
          const prefixText = contentToRedact.slice(0, logsPayload.startIndex);
          const suffixText = contentToRedact.slice(logsPayload.endIndex);

          const redactedLogs = redactSecrets(logsPayload.logs);
          const fence = getMarkdownCodeFence(redactedLogs);
          const header = [
            'Logs retrieved for',
            logsPayload.resourceType || 'resource',
            logsPayload.resourceName ? `"${logsPayload.resourceName}"` : '',
            logsPayload.namespace ? `in namespace "${logsPayload.namespace}"` : '',
            logsPayload.containerName ? `(container: ${logsPayload.containerName})` : '',
          ]
            .filter(Boolean)
            .join(' ');

          const isGeneratedToolEnvelope = role === 'tool' && prefixText.trim() === '';

          if (isGeneratedToolEnvelope) {
            lines.push(`${header}:`);
            lines.push('');
            lines.push(fence);
            lines.push(redactedLogs);
            lines.push(fence);
            lines.push('');
          } else {
            if (prefixText.trim()) {
              lines.push(formatMessageContent(prefixText.trim()));
              lines.push('');
            }

            lines.push(`${header}:`);
            lines.push('');
            lines.push(fence);
            lines.push(redactedLogs);
            lines.push(fence);
            lines.push('');

            if (suffixText.trim()) {
              lines.push(formatMessageContent(suffixText.trim()));
              lines.push('');
            }
          }
        } else {
          lines.push(formatMessageContent(contentToRedact));
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
              const sanitized = sanitizeSecretMutations(extracted.args);
              let redactedArgs = redactSecretsInValue(sanitized);
              if (typeof sanitized === 'string') {
                try {
                  const parsed = JSON.parse(sanitized);
                  if (typeof parsed === 'object' && parsed !== null) {
                    redactedArgs = redactSecretsInValue(sanitizeSecretMutations(parsed));
                  }
                } catch {
                  // Keep as string
                }
              }
              const formattedArgs =
                typeof redactedArgs === 'string'
                  ? redactedArgs
                  : JSON.stringify(redactedArgs, null, 2);
              const jsonFence = getMarkdownCodeFence(formattedArgs);
              lines.push(`${jsonFence}json`);
              lines.push(redactSecrets(formattedArgs.trim()));
              lines.push(jsonFence);
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
