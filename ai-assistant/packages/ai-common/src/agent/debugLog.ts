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

/**
 * Levelled debug logger for AI agent response parsing and data flow.
 *
 * Flip `DEBUG` below to control output:
 *
 *   const DEBUG = false;  // silent (default)
 *   const DEBUG = 1;      // lifecycle: session events, connection failures, content-type detection
 *   const DEBUG = 2;      // + detail: per-transform summaries, data chunks, thinking-step updates
 *   const DEBUG = 3;      // + verbose: per-line noise drops, full raw/parsed dumps, every step
 *
 * Always silent in production builds and tests regardless of the value.
 */

const DEBUG: number | boolean = false;

function level(): number {
  // Always silent in tests and production
  try {
    if (import.meta.env.MODE === 'test') return 0;
    if (!import.meta.env.DEV) return 0;
  } catch {
    return 0;
  }

  if (DEBUG === false || DEBUG === 0) return 0;
  if (DEBUG === true) return 1;
  return DEBUG;
}

/** Level 1 — high-level lifecycle events. */
export function debugLog(tag: string, ...args: unknown[]): void {
  if (level() < 1) return;
  console.debug(tag, ...args);
}

/** Level 2 — intermediate per-transform summaries. */
export function detailLog(tag: string, ...args: unknown[]): void {
  if (level() < 2) return;
  console.debug(tag, ...args);
}

/** Level 3 — full verbose per-line / per-step output. */
export function verboseLog(tag: string, ...args: unknown[]): void {
  if (level() < 3) return;
  console.debug(tag, ...args);
}

/** Level 1 — warnings. */
export function warnLog(tag: string, ...args: unknown[]): void {
  if (level() < 1) return;
  console.warn(tag, ...args);
}

/**
 * Level 3 — log a raw→parsed pair as JSON for copy-pasting into tests.
 */
export function dumpForTestCase(tag: string, raw: string, parsed: string): void {
  if (level() < 3) return;
  console.debug(
    `[AI Agent TestCase] ${tag}\n  input:  ${JSON.stringify(raw)}\n  output: ${JSON.stringify(
      parsed
    )}`
  );
}
