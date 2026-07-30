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

import { describe, expect, it } from 'vitest';
import { parseBmcScheme } from './bmcScheme';

describe('parseBmcScheme', () => {
  it('recognises redfish', () => {
    expect(parseBmcScheme('redfish://host')).toEqual({
      scheme: 'redfish',
      protocol: 'Redfish',
      status: 'ok',
    });
  });

  it('recognises ipmi', () => {
    expect(parseBmcScheme('ipmi://192.168.1.10')).toEqual({
      scheme: 'ipmi',
      protocol: 'IPMI',
      status: 'ok',
    });
  });

  it('recognises idrac-virtualmedia', () => {
    expect(parseBmcScheme('idrac-virtualmedia://host').status).toBe('ok');
  });

  it('tolerates the +https suffix on the redfish family', () => {
    expect(parseBmcScheme('redfish+https://host')).toEqual({
      scheme: 'redfish',
      protocol: 'Redfish',
      status: 'ok',
    });
  });

  it('lower-cases the scheme', () => {
    expect(parseBmcScheme('REDFISH://host').status).toBe('ok');
  });

  it('flags a missing scheme as the IPMI trap', () => {
    expect(parseBmcScheme('bmc.example.com:8443')).toEqual({
      scheme: '',
      protocol: 'Unknown',
      status: 'missing',
    });
  });

  it('flags undefined and empty as missing', () => {
    expect(parseBmcScheme(undefined).status).toBe('missing');
    expect(parseBmcScheme('').status).toBe('missing');
  });

  it('flags an unrecognised scheme as unknown', () => {
    expect(parseBmcScheme('foobar://host')).toEqual({
      scheme: 'foobar',
      protocol: 'foobar',
      status: 'unknown',
    });
  });
});
