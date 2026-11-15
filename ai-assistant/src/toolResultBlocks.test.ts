import { describe, expect, it } from 'vitest';
import {
  removeToolResultBlocksBeforeHeadings,
  removeTrailingToolResultBlock,
} from './toolResultBlocks';

describe('removeToolResultBlocksBeforeHeadings', () => {
  it('removes tool result blocks up to the next heading', () => {
    expect(
      removeToolResultBlocksBeforeHeadings(
        'Intro\n🔧 kubectl_get result: pod list\nmore\n## Findings\nok\n🔧 logs result: x\n  ## Next'
      )
    ).toBe('Intro\n\n## Findings\nok\n\n  ## Next');
  });

  it('keeps tool result blocks that are not followed by a heading', () => {
    const input = 'Intro\n🔧 kubectl_get result: pod list';
    expect(removeToolResultBlocksBeforeHeadings(input)).toBe(input);
  });

  it('keeps tool lines that are not results', () => {
    const input = '🔧 Using Agent tool: kubectl\n## Findings';
    expect(removeToolResultBlocksBeforeHeadings(input)).toBe(input);
  });
});

describe('removeTrailingToolResultBlock', () => {
  it('removes everything from the first tool result header', () => {
    expect(removeTrailingToolResultBlock('## Findings\nok\n🔧 logs result: a\nb')).toBe(
      '## Findings\nok\n'
    );
  });

  it('returns text without tool result headers unchanged', () => {
    expect(removeTrailingToolResultBlock('🔧 kubectl')).toBe('🔧 kubectl');
  });
});

describe('tool result scanning', () => {
  it('handles adversarial agent output in linear time', () => {
    const inputs = ['🔧'.repeat(50_000), `🔧 t result:${'\n'.repeat(100_000)}x`];
    for (const input of inputs) {
      const start = performance.now();
      removeTrailingToolResultBlock(removeToolResultBlocksBeforeHeadings(input));
      expect(performance.now() - start).toBeLessThan(500);
    }
  });
});
