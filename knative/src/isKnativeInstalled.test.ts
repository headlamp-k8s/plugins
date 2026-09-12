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

import { describe, expect, it, vi } from 'vitest';
import { isKnativeInstalled } from './isKnativeInstalled';
import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    apiGet: vi.fn(),
  },
}));

describe('isKnativeInstalled', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when clusters is empty or invalid', async () => {
    expect(await isKnativeInstalled([])).toBe(false);
    expect(await isKnativeInstalled(null as unknown as string[])).toBe(false);
    expect(await isKnativeInstalled(undefined as unknown as string[])).toBe(false);
  });

  it('should return true when Knative CRD exists in a single cluster', async () => {
    vi.mocked(CustomResourceDefinition.apiGet).mockImplementation(
      ((onSuccess: () => void) => {
        return () => {
          onSuccess();
          return Promise.resolve(vi.fn());
        };
      }) as unknown as typeof CustomResourceDefinition.apiGet
    );

    const result = await isKnativeInstalled(['cluster-1']);
    expect(result).toBe(true);
  });

  it('should return false when Knative CRD is missing in a single cluster', async () => {
    vi.mocked(CustomResourceDefinition.apiGet).mockImplementation(
      ((_onSuccess: unknown, _crdName: unknown, _override: unknown, onError: () => void) => {
        return () => {
          onError();
          return Promise.resolve(vi.fn());
        };
      }) as unknown as typeof CustomResourceDefinition.apiGet
    );

    const result = await isKnativeInstalled(['cluster-1']);
    expect(result).toBe(false);
  });

  it('should return true when Knative CRD exists across all multiple clusters', async () => {
    vi.mocked(CustomResourceDefinition.apiGet).mockImplementation(
      ((onSuccess: () => void) => {
        return () => {
          onSuccess();
          return Promise.resolve(vi.fn());
        };
      }) as unknown as typeof CustomResourceDefinition.apiGet
    );

    const result = await isKnativeInstalled(['cluster-1', 'cluster-2']);
    expect(result).toBe(true);
  });

  it('should return false when Knative CRD is missing in any of the clusters', async () => {
    vi.mocked(CustomResourceDefinition.apiGet).mockImplementation(
      (
        (
          onSuccess: () => void,
          _crdName: unknown,
          _override: unknown,
          onError: () => void,
          options?: { cluster?: string }
        ) => {
          return () => {
            if (options?.cluster === 'cluster-1') {
              onSuccess();
            } else {
              onError();
            }
            return Promise.resolve(vi.fn());
          };
        }
      ) as unknown as typeof CustomResourceDefinition.apiGet
    );

    const result = await isKnativeInstalled(['cluster-1', 'cluster-2']);
    expect(result).toBe(false);
  });

  it('should return false when apiGet request rejects with an error', async () => {
    vi.mocked(CustomResourceDefinition.apiGet).mockImplementation(
      (() => {
        return () => Promise.reject(new Error('Network error'));
      }) as unknown as typeof CustomResourceDefinition.apiGet
    );

    const result = await isKnativeInstalled(['cluster-1']);
    expect(result).toBe(false);
  });
});
