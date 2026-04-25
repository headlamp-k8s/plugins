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

import { formatIngressClass, INGRESS_CLASS_GATEWAY_API } from './ingress';

describe('formatIngressClass', () => {
  it('should return "(not set)" for null', () => {
    expect(formatIngressClass(null)).toBe('(not set)');
  });

  it('should return "(not set)" for empty string', () => {
    expect(formatIngressClass('')).toBe('(not set)');
  });

  it('should strip the ingress class suffix', () => {
    expect(formatIngressClass('gateway-api.ingress.networking.knative.dev')).toBe('gateway-api');
    expect(formatIngressClass('istio.ingress.networking.knative.dev')).toBe('istio');
    expect(formatIngressClass('kourier.ingress.networking.knative.dev')).toBe('kourier');
    expect(formatIngressClass('contour.ingress.networking.knative.dev')).toBe('contour');
  });

  it('should return the value as-is if suffix is not present', () => {
    expect(formatIngressClass('custom-ingress')).toBe('custom-ingress');
    expect(formatIngressClass('some.other.class')).toBe('some.other.class');
  });

  it('should handle the INGRESS_CLASS_GATEWAY_API constant', () => {
    expect(formatIngressClass(INGRESS_CLASS_GATEWAY_API)).toBe('gateway-api');
  });
});
