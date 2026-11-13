import { describe, expect, test } from 'vitest';
import { commitPendingValue, normalizeFreeSoloValues } from './freeSolo';

describe('commitPendingValue', () => {
  test('appends trimmed text that was not confirmed with Enter', () => {
    expect(commitPendingValue(['default'], ' shop ')).toEqual(['default', 'shop']);
  });

  test('leaves the list unchanged for blank or duplicate text', () => {
    expect(commitPendingValue(['shop'], '   ')).toEqual(['shop']);
    expect(commitPendingValue(['shop'], 'shop')).toEqual(['shop']);
  });

  test('trims values already confirmed with Enter or blur', () => {
    expect(commitPendingValue([' kube-system ', ' '], '')).toEqual(['kube-system']);
  });
});

describe('normalizeFreeSoloValues', () => {
  test('trims, drops blanks, and keeps the first of each name', () => {
    expect(normalizeFreeSoloValues([' kube-system ', ' ', 'kube-system', 'default'])).toEqual([
      'kube-system',
      'default',
    ]);
  });
});
