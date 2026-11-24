import { describe, expect, test } from 'vitest';
import { isMissingCrdError } from './DataMovementSections';

function err(message: string, status?: number): Error {
  const e = new Error(message) as Error & { status?: number };
  if (status !== undefined) {
    e.status = status;
  }
  return e;
}

describe('isMissingCrdError', () => {
  test('treats explicit 404 status as missing CRD', () => {
    expect(isMissingCrdError(err('whatever', 404))).toBe(true);
  });

  test('does not treat 403 as missing CRD even if message mentions 404', () => {
    expect(
      isMissingCrdError(err('forbidden for system:serviceaccount:velero:viewer-404', 403))
    ).toBe(false);
  });

  test('message fallback without status still detects Kubernetes not-found wording', () => {
    expect(isMissingCrdError(err('the server could not find the requested resource'))).toBe(true);
  });

  test('bare 404 substring in identity name is not enough without status', () => {
    expect(isMissingCrdError(err('forbidden for viewer-404'))).toBe(false);
  });
});
