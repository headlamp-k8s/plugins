/**
 * Pure helper functions for proactive diagnosis UI rendering.
 *
 * These functions translate {@link DiagnosisResult} and
 * {@link DiagnosisThinkingStep} objects into display-ready strings,
 * icons, and colours. They contain no React or DOM dependencies and are
 * safe to unit-test in isolation.
 */

import type { DiagnosisResult, DiagnosisThinkingStep } from './ProactiveDiagnosisManager';

/* ── Status helpers ──────────────────────────────────────────────── */

/**
 * Returns a status emoji for a diagnosis result.
 *
 * - ⏳ — actively loading
 * - ⬜ — queued / pending
 * - ❌ — failed with an error
 * - ✅ — completed successfully
 */
export function getStatusIcon(d: DiagnosisResult): string {
  if (d.loading) return '⏳';
  if (d.pending) return '⬜';
  if (d.error) return '❌';
  return '✅';
}

/**
 * Returns a human-readable status label for a diagnosis result.
 *
 * Possible values: `"Diagnosing…"`, `"Queued"`, `"Failed"`, `"Completed"`.
 */
export function getStatusLabel(d: DiagnosisResult): string {
  if (d.loading) return 'Diagnosing…';
  if (d.pending) return 'Queued';
  if (d.error) return 'Failed';
  return 'Completed';
}

/* ── Step display helpers ───────────────────────────────────────── */

/**
 * Returns a short summary string for a thinking step.
 *
 * - `tool-start` — extracts the tool name from `"label: toolName"` format
 * - `tool-result` — `"Tool done"`
 * - `todo-update` — `"Updating plan…"`
 * - anything else — `"Thinking…"`
 */
export function getStepSummary(step: DiagnosisThinkingStep): string {
  if (step.type === 'tool-start') {
    const match = step.content.match(/:\s*(.+)/);
    return match ? `${match[1].trim()}…` : 'Calling tool…';
  }
  if (step.type === 'tool-result') return 'Tool done';
  if (step.type === 'todo-update') return 'Updating plan…';
  return 'Thinking…';
}

/**
 * Returns an Iconify icon identifier for a given thinking-step type.
 *
 * | Type              | Icon                        |
 * | ----------------- | --------------------------- |
 * | `tool-start`      | `mdi:wrench`                |
 * | `tool-result`     | `mdi:check`                 |
 * | `todo-update`     | `mdi:format-list-checks`    |
 * | _other_           | `mdi:message-text-outline`  |
 */
export function getStepIcon(type: DiagnosisThinkingStep['type']): string {
  switch (type) {
    case 'tool-start':
      return 'mdi:wrench';
    case 'tool-result':
      return 'mdi:check';
    case 'todo-update':
      return 'mdi:format-list-checks';
    default:
      return 'mdi:message-text-outline';
  }
}

/**
 * Returns a theme-aware CSS colour string for a step-type icon.
 *
 * Expects a MUI `theme` object with `palette.info.main`,
 * `palette.success.main`, `palette.warning.main`, and
 * `palette.text.secondary`.
 *
 * @param type  - The thinking-step type.
 * @param theme - A MUI theme (or any object matching the expected shape).
 * @returns A CSS colour string.
 */
export function getStepIconColor(
  type: DiagnosisThinkingStep['type'],
  theme: {
    palette: {
      info: { main: string };
      success: { main: string };
      warning: { main: string };
      text: { secondary: string };
    };
  }
): string {
  switch (type) {
    case 'tool-start':
      return theme.palette.info.main;
    case 'tool-result':
      return theme.palette.success.main;
    case 'todo-update':
      return theme.palette.warning.main;
    default:
      return theme.palette.text.secondary;
  }
}

/**
 * Returns a human-readable label for a thinking-step type.
 *
 * | Type              | Label             |
 * | ----------------- | ----------------- |
 * | `tool-start`      | `"Tool call"`     |
 * | `tool-result`     | `"Tool result"`   |
 * | `todo-update`     | `"Plan update"`   |
 * | _other_           | `"Intermediate"`  |
 */
export function getStepTypeLabel(type: DiagnosisThinkingStep['type']): string {
  switch (type) {
    case 'tool-start':
      return 'Tool call';
    case 'tool-result':
      return 'Tool result';
    case 'todo-update':
      return 'Plan update';
    default:
      return 'Intermediate';
  }
}

/* ── Content parser ─────────────────────────────────────────────── */

/**
 * Splits raw diagnosis text into a *thinking* portion and an *answer* portion.
 *
 * **Heuristic:** lines starting with 🔧 or `### Investigation Tasks` are
 * classified as "thinking". The last contiguous block of non-thinking text
 * is treated as the answer; everything before it (including any
 * non-thinking gaps sandwiched between thinking blocks) is "thinking".
 *
 * @param text - The raw diagnosis text returned by the AI.
 * @returns An object with `thinking` and `answer` strings (either may be empty).
 */
export function splitDiagnosisContent(text: string): { thinking: string; answer: string } {
  if (!text) return { thinking: '', answer: '' };

  const lines = text.split('\n');

  const thinkingPatterns = [/^🔧/, /^###?\s*Investigation Tasks/i, /^\d+\.\s*[⏳⬜✅❌]/];

  const isThinkingLine = (line: string) => thinkingPatterns.some(p => p.test(line.trim()));

  let lastThinkingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isThinkingLine(lines[i])) {
      lastThinkingIdx = i;
    }
  }

  if (lastThinkingIdx === -1) {
    return { thinking: '', answer: text };
  }

  let answerStart = lastThinkingIdx + 1;
  while (answerStart < lines.length && lines[answerStart].trim() === '') {
    answerStart++;
  }

  const thinking = lines.slice(0, answerStart).join('\n').trim();
  const answer = lines.slice(answerStart).join('\n').trim();

  return { thinking, answer };
}
