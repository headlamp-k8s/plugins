import { describe, expect, test } from 'vitest';
import { commitPendingValue } from './freeSolo';

describe('commitPendingValue', () => {
  test('appends trimmed text that was not confirmed with Enter', () => {
    expect(commitPendingValue(['default'], ' shop ')).toEqual(['default', 'shop']);
  });

  test('leaves the list unchanged for blank or duplicate text', () => {
    expect(commitPendingValue(['shop'], '   ')).toEqual(['shop']);
    expect(commitPendingValue(['shop'], 'shop')).toEqual(['shop']);
  });
});
