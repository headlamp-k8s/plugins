/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectOIDCMismatchError, isOIDCMismatchError } from './detectOIDCMismatch';

describe('detectOIDCMismatchError', () => {
  let mockResponse: Response;

  beforeEach(() => {
    mockResponse = {
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response;
  });

  it('should detect OIDC mismatch error with 401 response', async () => {
    const responseBody = {
      kind: 'Status',
      status: 'Failure',
      reason: 'OIDCConfigMismatch',
      message: 'Kubernetes API server may not be configured for OIDC authentication',
      details: {
        errorType: 'oidc-mismatch',
        suggestedAction: 'Verify OIDC configuration matches',
        originalStatus: 401,
      },
    };

    mockResponse.clone = vi.fn(
      () =>
        ({
          json: vi.fn(async () => responseBody),
        } as any)
    );

    const result = await detectOIDCMismatchError(mockResponse, 'test-cluster');

    expect(result).not.toBeNull();
    expect(result?.type).toBe('oidc-mismatch');
    expect(result?.clusterName).toBe('test-cluster');
    expect(result?.originalStatus).toBe(401);
  });

  it('should detect OIDC mismatch error with 403 response', async () => {
    const testResponse = {
      ...mockResponse,
      status: 403,
    } as Response;

    const responseBody = {
      details: {
        errorType: 'oidc-mismatch',
        originalStatus: 403,
      },
    };

    mockResponse.clone = vi.fn().mockResolvedValueOnce(JSON.stringify(responseBody));

    const result = await detectOIDCMismatchError(testResponse, 'prod-cluster');

    expect(result).not.toBeNull();
    expect(result?.type).toBe('oidc-mismatch');
    expect(result?.originalStatus).toBe(403);
  });

  it('should return null for non-401/403 responses', async () => {
    const testResponse = {
      ...mockResponse,
      status: 200,
    } as Response;

    const result = await detectOIDCMismatchError(testResponse);

    expect(result).toBeNull();
  });

  it('should return null when response is not JSON', async () => {
    const testResponse = {
      ...mockResponse,
      headers: new Headers({ 'content-type': 'text/plain' }),
    } as Response;

    const result = await detectOIDCMismatchError(testResponse);

    expect(result).toBeNull();
  });

  it('should return null when errorType is not oidc-mismatch', async () => {
    const responseBody = {
      details: {
        errorType: 'some-other-error',
      },
    };

    mockResponse.clone = vi.fn(
      () =>
        ({
          json: vi.fn(async () => responseBody),
        } as any)
    );

    const result = await detectOIDCMismatchError(mockResponse);

    expect(result).toBeNull();
  });

  it('should return null when JSON parsing fails', async () => {
    mockResponse.clone = vi.fn(
      () =>
        ({
          json: vi.fn(async () => {
            throw new Error('JSON parse failed');
          }),
        } as any)
    );

    const result = await detectOIDCMismatchError(mockResponse);

    expect(result).toBeNull();
  });

  it('should use default values when fields are missing', async () => {
    const testResponse = {
      ...mockResponse,
      status: 401,
    } as Response;
    const responseBody = {
      details: {
        errorType: 'oidc-mismatch',
      },
    };

    testResponse.clone = vi.fn().mockResolvedValueOnce(JSON.stringify(responseBody));

    const result = await detectOIDCMismatchError(testResponse, 'default-cluster');

    expect(result).not.toBeNull();
    expect(result?.message).toBe('OIDC configuration mismatch detected');
    expect(result?.suggestedAction).toContain('Verify Kubernetes');
    expect(result?.clusterName).toBe('default-cluster');
  });

  it('should use unknown cluster name when not provided', async () => {
    const responseBody = {
      details: {
        errorType: 'oidc-mismatch',
      },
    };

    mockResponse.clone = vi.fn(
      () =>
        ({
          json: vi.fn(async () => responseBody),
        } as any)
    );

    const result = await detectOIDCMismatchError(mockResponse);

    expect(result?.clusterName).toBe('unknown');
  });
});

describe('isOIDCMismatchError', () => {
  it('should return true for OIDC mismatch error object', () => {
    const error = {
      type: 'oidc-mismatch',
      clusterName: 'test',
      message: 'test message',
      originalStatus: 401,
      suggestedAction: 'test action',
    };

    expect(isOIDCMismatchError(error)).toBe(true);
  });

  it('should return false for other error objects', () => {
    const error = {
      type: 'other-error',
      message: 'test message',
    };

    expect(isOIDCMismatchError(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isOIDCMismatchError(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isOIDCMismatchError(undefined)).toBe(false);
  });

  it('should return false for non-object values', () => {
    expect(isOIDCMismatchError('string')).toBe(false);
    expect(isOIDCMismatchError(123)).toBe(false);
    expect(isOIDCMismatchError(true)).toBe(false);
  });

  it('should return false for objects without type field', () => {
    const error = {
      message: 'test message',
      code: 401,
    };

    expect(isOIDCMismatchError(error)).toBe(false);
  });
});
