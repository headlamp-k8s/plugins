// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('API failed');
    expect(getErrorMessage(error)).toBe('API failed');
  });

  it('should handle string errors', () => {
    expect(getErrorMessage('Something broke')).toBe('Something broke');
  });

  it('should handle objects with message property', () => {
    const error = { message: 'Custom error' };
    expect(getErrorMessage(error)).toBe('Custom error');
  });

  it('should handle objects with non-string message property', () => {
    const error = { message: 123 };
    expect(getErrorMessage(error)).toBe('An unknown error occurred');
  });

  it('should return fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });

  it('should return fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should return fallback for numbers', () => {
    expect(getErrorMessage(123)).toBe('An unknown error occurred');
  });

  it('should return fallback for empty objects', () => {
    expect(getErrorMessage({})).toBe('An unknown error occurred');
  });
});
