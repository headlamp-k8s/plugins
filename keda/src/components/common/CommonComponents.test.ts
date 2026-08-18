import { describe, expect, it } from 'vitest';
import { sortByCompletions } from './CommonComponents';

function job(completions?: number, parallelism?: number) {
  return { spec: { completions, parallelism } } as any;
}

describe('sortByCompletions', () => {
  it('sorts by completions, not parallelism, when they disagree', () => {
    // job1 has fewer completions but more parallelism than job2 — a completions-first
    // sort must put job1 before job2, the opposite of what a parallelism-first sort would do.
    expect(sortByCompletions(job(1, 5), job(5, 1))).toBeLessThan(0);
  });

  it('falls back to parallelism when completions are equal', () => {
    expect(sortByCompletions(job(2, 1), job(2, 4))).toBeLessThan(0);
  });

  it('treats missing completions/parallelism as 0 instead of NaN', () => {
    expect(sortByCompletions(job(undefined, undefined), job(1, 1))).toBeLessThan(0);
    expect(
      Number.isNaN(sortByCompletions(job(undefined, undefined), job(undefined, undefined)))
    ).toBe(false);
  });
});
