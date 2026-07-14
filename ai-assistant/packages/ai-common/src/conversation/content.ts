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

/** Extracts text from provider content shapes without depending on a model framework. */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (item): item is { type: 'text'; text?: unknown } =>
          typeof item === 'object' && item !== null && 'type' in item && item.type === 'text'
      )
      .map(item => (typeof item.text === 'string' ? item.text : ''))
      .join('');
  }
  if (content && typeof content === 'object') {
    const object = content as Record<string, unknown>;
    if (object.text) return String(object.text);
    if (object.content) return extractTextContent(object.content);
  }
  try {
    return String(content || '');
  } catch {
    return '';
  }
}

/** Result of validating and size-limiting tool content. */
export interface ProcessedContent {
  text: string;
  truncated: boolean;
}

/** Validates and size-limits one tool-response content string. */
export function processToolContent(
  content: unknown,
  currentSize: number,
  maxSize: number
): ProcessedContent | null {
  if (!content || typeof content !== 'string') return null;
  if (currentSize + content.length <= maxSize) return { text: content, truncated: false };

  const suffix = ` ... [Response truncated, exceeded size limit of ${maxSize} bytes]`;
  const remaining = Math.max(0, maxSize - currentSize - suffix.length);
  return {
    text: content.substring(0, Math.min(100, remaining)) + suffix,
    truncated: true,
  };
}

/** Strips HTML and normalizes JSON content for safe model input. */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  try {
    if (
      (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
      (content.trim().startsWith('[') && content.trim().endsWith(']'))
    ) {
      return JSON.stringify(JSON.parse(content));
    }

    const text =
      typeof DOMParser !== 'undefined'
        ? new DOMParser().parseFromString(content, 'text/html').body.textContent || ''
        : content
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    return text.replace(/\[IMAGE\]/gi, '[IMAGE]');
  } catch {
    return content.substring(0, 5000).replace(/<[^>]*>/g, '');
  }
}
