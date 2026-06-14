import { describe, expect, it } from 'vitest';
import { buildLogTitle, getFormattedLogs, getLogLanguage } from './logFormatting';

/* ── getLogLanguage ─────────────────────────────────────────────── */

describe('getLogLanguage', () => {
  it('returns "text" for empty input', () => {
    expect(getLogLanguage('')).toBe('text');
  });

  it('returns "json" for JSON object', () => {
    expect(getLogLanguage('{"level":"info","msg":"ok"}')).toBe('json');
  });

  it('returns "json" for JSON array', () => {
    expect(getLogLanguage('[{"a":1}]')).toBe('json');
  });

  it('returns "properties" for ISO timestamp logs', () => {
    expect(getLogLanguage('2024-01-15T12:30:00 some log line')).toBe('properties');
  });

  it('returns "properties" for key=value structured logs', () => {
    expect(getLogLanguage('level=info msg="request handled"')).toBe('properties');
  });

  it('returns "text" for plain text', () => {
    expect(getLogLanguage('just a plain log line')).toBe('text');
  });
});

/* ── getFormattedLogs ───────────────────────────────────────────── */

describe('getFormattedLogs', () => {
  it('returns "No logs available" for empty input', () => {
    expect(getFormattedLogs('')).toBe('No logs available');
  });

  it('pretty-prints a JSON object', () => {
    const input = '{"level":"info","msg":"ok"}';
    const result = getFormattedLogs(input);
    expect(result).toContain('"level": "info"');
    expect(result).toContain('"msg": "ok"');
  });

  it('splits multiple JSON objects on a single line', () => {
    const input = '{"a":1}{"b":2}';
    const result = getFormattedLogs(input);
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 2');
  });

  it('returns plain text unchanged', () => {
    const input = 'just a plain log line';
    expect(getFormattedLogs(input)).toBe(input);
  });

  it('returns structured logs unchanged', () => {
    const input = '2024-01-15T12:30:00 level=info msg="ok"';
    expect(getFormattedLogs(input)).toBe(input);
  });

  it('preserves non-JSON lines within JSON logs', () => {
    const input = 'header line\n{"key":"value"}';
    const result = getFormattedLogs(input);
    expect(result).toContain('header line');
    expect(result).toContain('"key": "value"');
  });
});

/* ── buildLogTitle ──────────────────────────────────────────────── */

describe('buildLogTitle', () => {
  it('builds title with resource type and name', () => {
    expect(buildLogTitle('Pod', 'my-pod')).toBe('Pod my-pod Logs');
  });

  it('includes container name when provided', () => {
    expect(buildLogTitle('Pod', 'my-pod', 'app')).toBe('Pod my-pod (container: app) Logs');
  });

  it('includes namespace when no container is provided', () => {
    expect(buildLogTitle('Pod', 'my-pod', undefined, 'kube-system')).toBe(
      'Pod my-pod (kube-system) Logs'
    );
  });

  it('prefers container over namespace', () => {
    expect(buildLogTitle('Pod', 'my-pod', 'app', 'kube-system')).toBe(
      'Pod my-pod (container: app) Logs'
    );
  });
});
