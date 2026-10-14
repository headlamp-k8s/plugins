/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { formatDuration, jaegerTraceUrl } from './otel';

describe('jaegerTraceUrl', () => {
  it('composes a trace deep-link', () => {
    expect(jaegerTraceUrl('https://jaeger.example', 'abc')).toBe(
      'https://jaeger.example/trace/abc'
    );
  });

  it('strips a trailing slash on the base', () => {
    expect(jaegerTraceUrl('https://jaeger.example/', 'abc')).toBe(
      'https://jaeger.example/trace/abc'
    );
  });

  it('returns empty when no base is configured', () => {
    expect(jaegerTraceUrl('', 'abc')).toBe('');
    expect(jaegerTraceUrl(undefined, 'abc')).toBe('');
  });

  it('url-encodes the trace id', () => {
    expect(jaegerTraceUrl('http://j', 'a/b')).toBe('http://j/trace/a%2Fb');
  });
});

describe('formatDuration', () => {
  it('formats sub-millisecond as microseconds', () => {
    expect(formatDuration(500_000)).toBe('500µs');
  });

  it('formats milliseconds', () => {
    expect(formatDuration(1_500_000)).toBe('1.5ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(2_000_000_000)).toBe('2.00s');
  });

  it('handles zero and negative durations', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(-5)).toBe('0ms');
  });
});
