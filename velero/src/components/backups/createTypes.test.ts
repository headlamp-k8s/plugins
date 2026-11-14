import { describe, expect, test } from 'vitest';
import { fsBackupChoiceToSpec } from './createTypes';

describe('fsBackupChoiceToSpec', () => {
  test('omits the field for the server default and sends explicit on or off', () => {
    expect(fsBackupChoiceToSpec('server')).toBeUndefined();
    expect(fsBackupChoiceToSpec('on')).toBe(true);
    expect(fsBackupChoiceToSpec('off')).toBe(false);
  });
});
