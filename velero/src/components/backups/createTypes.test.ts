import { describe, expect, test } from 'vitest';
import { fsBackupChoiceToSpec, isUnavailableStorageLocation } from './createTypes';

describe('fsBackupChoiceToSpec', () => {
  test('omits the field for the server default and sends explicit on or off', () => {
    expect(fsBackupChoiceToSpec('server')).toBeUndefined();
    expect(fsBackupChoiceToSpec('on')).toBe(true);
    expect(fsBackupChoiceToSpec('off')).toBe(false);
  });
});

describe('isUnavailableStorageLocation', () => {
  test('is false for Velero default and for a location still in the list', () => {
    expect(isUnavailableStorageLocation('', ['default'])).toBe(false);
    expect(isUnavailableStorageLocation('default', ['default'])).toBe(false);
  });

  test('is true when the chosen location is no longer discovered', () => {
    expect(isUnavailableStorageLocation('aws', ['default'])).toBe(true);
    expect(isUnavailableStorageLocation('aws', [])).toBe(true);
  });
});
