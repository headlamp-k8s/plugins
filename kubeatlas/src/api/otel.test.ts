/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { otelOverlayPath, otelTracesPath } from './client';

describe('otelOverlayPath', () => {
  it('includes the namespace', () => {
    expect(otelOverlayPath('petclinic')).toBe('api/v1/otel/overlay?namespace=petclinic');
  });

  it('adds the compare flag', () => {
    expect(otelOverlayPath('petclinic', true)).toBe(
      'api/v1/otel/overlay?namespace=petclinic&compare=true'
    );
  });

  it('omits the query when the namespace is empty', () => {
    expect(otelOverlayPath('')).toBe('api/v1/otel/overlay');
  });

  it('url-encodes the namespace', () => {
    expect(otelOverlayPath('team a')).toBe('api/v1/otel/overlay?namespace=team%20a');
  });
});

describe('otelTracesPath', () => {
  it('includes the service filter', () => {
    expect(otelTracesPath('frontend')).toBe('api/v1/otel/traces?service=frontend');
  });

  it('omits the query when no service is given', () => {
    expect(otelTracesPath()).toBe('api/v1/otel/traces');
  });
});
