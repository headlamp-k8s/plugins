import { describe, expect, it } from 'vitest';
import { parseExceptions } from '../src/components/ExceptionsView';
import { parseLogs } from '../src/components/LogsView';
import { parseStacks } from '../src/components/StacksView';

describe('runtime view parsers', () => {
  it('parses ndjson logs into entries', () => {
    const entries = parseLogs(
      [
        '{"Timestamp":"2026-08-21T12:00:00Z","LogLevel":"Information","Category":"MyApp","Message":"Started"}',
        'plain log line',
      ].join('\n'),
    );

    expect(entries[0]?.message).toBe('Started');
    expect(entries[1]?.message).toBe('plain log line');
  });

  it('parses stack text into per-thread groups', () => {
    const threads = parseStacks(['Thread: 1', 'frame one', 'frame two', 'Thread: 2', 'frame three'].join('\n'));

    expect(threads).toHaveLength(2);
    expect(threads[0]?.frames.map((frame) => frame.text)).toEqual(['frame one', 'frame two']);
  });

  it('parses exception ndjson payloads', () => {
    const items = parseExceptions(
      '{"id":1,"timestamp":"2026-08-21T12:01:00Z","typeName":"System.Exception","message":"Boom"}',
    );

    expect(items[0]?.typeName).toBe('System.Exception');
    expect(items[0]?.message).toBe('Boom');
  });
});
