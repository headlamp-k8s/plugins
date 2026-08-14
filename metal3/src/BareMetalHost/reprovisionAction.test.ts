/*
 * Copyright 2026 The Kubernetes Authors
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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import {
  deprovisionPatch,
  imagePatch,
  isConsumed,
  isProvisioned,
  validateImage,
} from './reprovisionAction';

/** Builds a minimal BareMetalHost-shaped object, optionally with an image URL. */
function host(imageUrl?: string): KubeObject {
  return {
    jsonData: { spec: imageUrl ? { image: { url: imageUrl } } : {} },
  } as unknown as KubeObject;
}

describe('isProvisioned', () => {
  it('is true when the host has an image URL', () => {
    expect(isProvisioned(host('http://img/ubuntu.qcow2'))).toBe(true);
  });
  it('is false when the host has no image', () => {
    expect(isProvisioned(host())).toBe(false);
  });
});

describe('isConsumed', () => {
  it('is true when the host has a consumerRef', () => {
    const consumed = {
      jsonData: { spec: { consumerRef: { name: 'my-cluster-md-xyz98' } } },
    } as unknown as KubeObject;
    expect(isConsumed(consumed)).toBe(true);
  });
  it('is false when the host has no consumer', () => {
    expect(isConsumed(host())).toBe(false);
  });
});

describe('validateImage', () => {
  it('requires a URL', () => {
    expect(validateImage({ url: '', checksum: 'abc', format: 'qcow2' })).toMatch(/URL/);
  });
  it('requires a checksum for a normal format', () => {
    expect(validateImage({ url: 'http://img', checksum: '', format: 'qcow2' })).toMatch(/checksum/);
  });
  it('accepts a URL and checksum', () => {
    expect(validateImage({ url: 'http://img', checksum: 'abc', format: 'qcow2' })).toBeNull();
  });
  it('does not require a checksum for live-iso', () => {
    expect(validateImage({ url: 'http://img.iso', checksum: '', format: 'live-iso' })).toBeNull();
  });
  it('does not require a checksum for an oci image', () => {
    expect(validateImage({ url: 'oci://reg/img', checksum: '', format: '' })).toBeNull();
  });
});

describe('imagePatch', () => {
  it('builds the full image patch', () => {
    expect(imagePatch({ url: 'http://img', checksum: 'abc', format: 'qcow2' })).toEqual({
      spec: { image: { url: 'http://img', checksum: 'abc', format: 'qcow2' } },
    });
  });
  it('omits empty optional fields', () => {
    expect(imagePatch({ url: 'http://img', checksum: '', format: '' })).toEqual({
      spec: { image: { url: 'http://img' } },
    });
  });
  it('trims whitespace', () => {
    expect(imagePatch({ url: '  http://img  ', checksum: '  abc ', format: 'raw' })).toEqual({
      spec: { image: { url: 'http://img', checksum: 'abc', format: 'raw' } },
    });
  });
});

describe('deprovisionPatch', () => {
  it('clears the image with null', () => {
    expect(deprovisionPatch()).toEqual({ spec: { image: null } });
  });
});
