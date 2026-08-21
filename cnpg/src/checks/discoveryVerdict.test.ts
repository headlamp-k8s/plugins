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

import { verdictForDiscoveryError } from './discoveryVerdict';

describe('verdictForDiscoveryError', () => {
  it('reports a 404 as not installed, because that is what the API server said', () => {
    expect(verdictForDiscoveryError({ status: 404 })).toBe(false);
  });

  /*
   * The sidebar caches this verdict for the length of its TTL, so a transient
   * failure answered with `false` hides the whole plugin — every view, until the
   * cache expires — with nothing on screen to explain it. Only the API server
   * saying "no such API group" is evidence of absence; a dropped connection or a
   * proxy error is evidence of nothing.
   */
  it('does not conclude the operator is absent from a network failure', () => {
    expect(verdictForDiscoveryError({ message: 'Failed to fetch' })).toBeNull();
  });

  it('does not conclude the operator is absent from a server error', () => {
    expect(verdictForDiscoveryError({ status: 500 })).toBeNull();
  });

  it('does not conclude the operator is absent from a proxy timeout', () => {
    expect(verdictForDiscoveryError({ status: 504 })).toBeNull();
  });

  /*
   * Discovery is normally readable by any authenticated user, but a cluster can
   * restrict it. A denial says the user may not look, not that there is nothing
   * to see, and hiding the plugin on that basis is indistinguishable to the user
   * from the operator being uninstalled.
   */
  it('does not conclude the operator is absent from a denial', () => {
    expect(verdictForDiscoveryError({ status: 403 })).toBeNull();
  });

  it('does not conclude the operator is absent from an error it cannot classify', () => {
    expect(verdictForDiscoveryError(undefined)).toBeNull();
  });

  // The proxy reports an unserved API group as a 404 in the message when the
  // transport loses the status code, which is the same definite negative.
  it('reads a 404 reported only in the message as a definite negative', () => {
    expect(verdictForDiscoveryError({ message: 'Error: 404 page not found' })).toBe(false);
  });
});
