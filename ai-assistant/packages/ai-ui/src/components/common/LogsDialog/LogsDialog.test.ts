import { describe, expect, it } from 'vitest';
import { buildLogTitle, getFormattedLogs, getLogLanguage } from '../../../formatting/logFormatting';

/* ── getLogLanguage ─────────────────────────────────────────────── */

describe('getLogLanguage', () => {
  it('returns "text" for empty input', () => {
    expect(getLogLanguage('')).toBe('text');
  });

  it('returns "json" when logs contain a JSON object', () => {
    expect(getLogLanguage('{"level":"info","msg":"started"}')).toBe('json');
  });

  it('returns "json" when logs contain a JSON array', () => {
    expect(getLogLanguage('[{"a":1}]')).toBe('json');
  });

  it('returns "properties" for structured key=value logs', () => {
    expect(getLogLanguage('level=info msg=started')).toBe('properties');
  });

  it('returns "properties" for ISO-timestamped logs', () => {
    expect(getLogLanguage('2024-01-15T10:30:00 some log line')).toBe('properties');
  });

  it('returns "text" for plain text', () => {
    expect(getLogLanguage('Hello, world!')).toBe('text');
  });
});

/* ── getFormattedLogs ───────────────────────────────────────────── */

describe('getFormattedLogs', () => {
  it('returns "No logs available" for empty input', () => {
    expect(getFormattedLogs('')).toBe('No logs available');
  });

  it('returns plain text unchanged', () => {
    const text = 'plain log line\nanother line';
    expect(getFormattedLogs(text)).toBe(text);
  });

  it('pretty-prints a JSON line', () => {
    const input = '{"a":1,"b":2}';
    const result = getFormattedLogs(input);
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 2');
  });

  it('splits multiple JSON objects on one line', () => {
    const input = '{"a":1}{"b":2}';
    const result = getFormattedLogs(input);
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 2');
  });

  it('preserves non-JSON lines', () => {
    const input = '{"a":1}\nnon-json line';
    const result = getFormattedLogs(input);
    expect(result).toContain('non-json line');
  });
});

/* ── buildLogTitle ──────────────────────────────────────────────── */

describe('buildLogTitle', () => {
  it('returns "Resource name Logs" for basic inputs', () => {
    expect(buildLogTitle('Pod', 'my-pod')).toBe('Pod my-pod Logs');
  });

  it('includes container name when provided', () => {
    expect(buildLogTitle('Pod', 'my-pod', 'app')).toBe('Pod my-pod (container: app) Logs');
  });

  it('includes namespace when no container name', () => {
    expect(buildLogTitle('Pod', 'my-pod', undefined, 'default')).toBe('Pod my-pod (default) Logs');
  });

  it('prefers container name over namespace', () => {
    expect(buildLogTitle('Pod', 'my-pod', 'app', 'default')).toBe(
      'Pod my-pod (container: app) Logs'
    );
  });

  it('handles empty resource name', () => {
    expect(buildLogTitle('Pod', '')).toBe('Pod Logs');
  });
});
