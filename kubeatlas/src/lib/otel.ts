/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

// Pure helpers for the F-204 OTel overlay view (KubeAtlas v1.5). Kept
// out of the React components so they unit-test without a DOM.

// jaegerTraceUrl composes a deep-link to a trace in a Jaeger/Tempo UI.
// KubeAtlas condenses traces into a runtime-call topology; deep span
// inspection is Jaeger's job, so a trace row links out to it. Returns
// '' when no base URL is configured (the row is then inert).
export function jaegerTraceUrl(base: string | undefined, traceId: string): string {
  if (!base || !traceId) {
    return '';
  }
  return `${base.replace(/\/+$/, '')}/trace/${encodeURIComponent(traceId)}`;
}

// formatDuration renders a nanosecond span duration compactly.
export function formatDuration(ns: number): string {
  if (!Number.isFinite(ns) || ns <= 0) {
    return '0ms';
  }
  const ms = ns / 1e6;
  if (ms < 1) {
    return `${Math.round(ns / 1e3)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}
