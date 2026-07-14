import { describe, expect, it } from 'vitest';
import { isApiRelatedError, toUserFriendlyError } from './formatAssistantError';

describe('toUserFriendlyError', () => {
  it('returns generic message for null/undefined', () => {
    expect(toUserFriendlyError(null)).toBe('Unknown error occurred');
    expect(toUserFriendlyError(undefined)).toBe('Unknown error occurred');
  });

  it('maps network error messages', () => {
    expect(toUserFriendlyError(new Error('network error occurred'))).toContain('Network');
  });

  it('maps timeout messages', () => {
    expect(toUserFriendlyError(new Error('request timed out'))).toContain('timed out');
  });

  it('maps 401 to authentication error', () => {
    expect(toUserFriendlyError(new Error('401 unauthorized'))).toContain('Authentication');
  });

  it('maps 403 to access denied', () => {
    expect(toUserFriendlyError(new Error('403 forbidden'))).toContain('Access denied');
  });

  it('maps 404 to not found', () => {
    expect(toUserFriendlyError(new Error('not found'))).toContain('not found');
  });

  it('maps rate limit to too-many-requests', () => {
    expect(toUserFriendlyError(new Error('rate limit exceeded'))).toContain('Too many requests');
  });

  it('strips Error: prefix for unmapped messages', () => {
    const result = toUserFriendlyError(new Error('Error: something weird happened'));
    expect(result).toBe('something weird happened');
  });

  it('strips TypeError: prefix', () => {
    const result = toUserFriendlyError(new Error('TypeError: cannot read property'));
    expect(result).toBe('cannot read property');
  });

  it('accepts plain strings', () => {
    const result = toUserFriendlyError('plain string error');
    expect(result).toBe('plain string error');
  });

  it('returns fallback when message is empty after stripping', () => {
    const result = toUserFriendlyError(new Error(''));
    expect(result).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('isApiRelatedError', () => {
  it('returns false for null', () => {
    expect(isApiRelatedError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isApiRelatedError(undefined)).toBe(false);
  });

  it('returns true when error.message contains "api"', () => {
    expect(isApiRelatedError(new Error('API key missing'))).toBe(true);
  });

  it('returns true when error.message contains "request"', () => {
    expect(isApiRelatedError(new Error('request failed'))).toBe(true);
  });

  it('returns true when error.message contains "network"', () => {
    expect(isApiRelatedError(new Error('network unreachable'))).toBe(true);
  });

  it('returns true when error.message contains "fetch"', () => {
    expect(isApiRelatedError(new Error('failed to fetch'))).toBe(true);
  });

  it('returns true when error.message contains "timeout"', () => {
    expect(isApiRelatedError(new Error('connection timeout'))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isApiRelatedError(new Error('NETWORK ERROR'))).toBe(true);
    expect(isApiRelatedError(new Error('API Key Invalid'))).toBe(true);
  });

  it('returns false for a pure logic/validation error', () => {
    expect(isApiRelatedError(new Error('Cannot read property of undefined'))).toBe(false);
  });

  it('returns false for an empty-message error', () => {
    expect(isApiRelatedError(new Error(''))).toBe(false);
  });

  it('accepts a plain string', () => {
    expect(isApiRelatedError('fetch timed out')).toBe(true);
    expect(isApiRelatedError('some validation failed')).toBe(false);
  });
});
