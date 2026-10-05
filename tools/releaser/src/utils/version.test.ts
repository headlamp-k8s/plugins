import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { sanitizeVersion, validateVersion } from './version.js';
describe('version utilities', () => {
  describe('sanitizeVersion', () => {
    // console.log is used in the implementation, so we spy on it specifically.
    let consoleSpy: MockInstance;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should return the same version if no leading v', () => {
      expect(sanitizeVersion('1.2.3')).toBe('1.2.3');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should remove leading v and warn', () => {
      expect(sanitizeVersion('v1.2.3')).toBe('1.2.3');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: Version "v1.2.3" contains a leading \'v\''));
    });

    it('should handle version with only v (though invalid semver)', () => {
      expect(sanitizeVersion('v')).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('validateVersion', () => {
    it('should return true for valid semver', () => {
      expect(validateVersion('1.2.3')).toBe(true);
      expect(validateVersion('0.1.0')).toBe(true);
      expect(validateVersion('1.2.3-alpha.1')).toBe(true);
      expect(validateVersion('1.2.3+build.1')).toBe(true);
    });

    it('should return false for invalid semver', () => {
      expect(validateVersion('v1.2.3')).toBe(false);
      expect(validateVersion('1.2')).toBe(false);
      expect(validateVersion('1.2.3.4')).toBe(false);
      expect(validateVersion('abc')).toBe(false);
      expect(validateVersion('')).toBe(false);
    });
  });
});
