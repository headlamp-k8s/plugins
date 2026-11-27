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
import { asRecord, draftNamespace, isAbsoluteUri, isRelativeUri, stringAt } from './formValues';

describe('asRecord', () => {
  it('reads a mapping, and gives an empty object for anything else', () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord(['a'])).toEqual({});
    expect(asRecord('a')).toEqual({});
    expect(asRecord(null)).toEqual({});
    expect(asRecord(undefined)).toEqual({});
  });
});

describe('stringAt', () => {
  it('reads a string field, and gives an empty string for any other value', () => {
    expect(stringAt({ name: 'orders' }, 'name')).toBe('orders');
    expect(stringAt({ name: 3 }, 'name')).toBe('');
    expect(stringAt({}, 'name')).toBe('');
  });
});

describe('draftNamespace', () => {
  it("reads the draft's namespace, and an empty string without one", () => {
    expect(draftNamespace({ metadata: { namespace: 'shop' } })).toBe('shop');
    expect(draftNamespace({ metadata: { name: 'orders' } })).toBe('');
    expect(draftNamespace({ metadata: 'shop' })).toBe('');
    expect(draftNamespace({})).toBe('');
  });
});

describe('isAbsoluteUri', () => {
  it('accepts a URI with a scheme and a host', () => {
    expect(isAbsoluteUri('https://example.com/events')).toBe(true);
    expect(isAbsoluteUri('http://event-display.shop.svc.cluster.local')).toBe(true);
  });

  it('rejects a relative URI, a URI without a host, and text', () => {
    expect(isAbsoluteUri('/events')).toBe(false);
    expect(isAbsoluteUri('mailto:ops@example.com')).toBe(false);
    expect(isAbsoluteUri('example.com')).toBe(false);
    expect(isAbsoluteUri('')).toBe(false);
  });

  it("reads the host as Go's net/url does, which is how Knative reads it", () => {
    expect(isAbsoluteUri('https:/example.com')).toBe(false);
    expect(isAbsoluteUri('http:example.com')).toBe(false);
    expect(isAbsoluteUri('http://user@')).toBe(false);
    expect(isAbsoluteUri('http://[::1]:8080/events')).toBe(true);
    expect(isAbsoluteUri('http://user@example.com:8080')).toBe(true);
  });

  it('rejects white space, control characters, and a port that is not a number', () => {
    expect(isAbsoluteUri('https://example.com/events ')).toBe(false);
    expect(isAbsoluteUri('https://exa mple.com')).toBe(false);
    expect(isAbsoluteUri('https://example.com/a\tb')).toBe(false);
    expect(isAbsoluteUri('https://example.com/a\u007fb')).toBe(false);
    expect(isAbsoluteUri('https://example.com:http')).toBe(false);
  });

  it("rejects the percent escapes that Go's net/url cannot decode, outside the query", () => {
    expect(isAbsoluteUri('https://example.com/%zz')).toBe(false);
    expect(isAbsoluteUri('https://example.com/%4')).toBe(false);
    expect(isAbsoluteUri('https://example.com/%')).toBe(false);
    expect(isAbsoluteUri('https://example.com/p?a=1#%zz')).toBe(false);
    expect(isAbsoluteUri('https://example.com/p#frag?x=%zz')).toBe(false);
    expect(isAbsoluteUri('https://us%zzer@example.com/')).toBe(false);
    expect(isAbsoluteUri('https://exa%zzmple.com/')).toBe(false);
    expect(isAbsoluteUri('https://exa%41mple.com/')).toBe(false);
    expect(isAbsoluteUri('https://example.com/a%2Fb')).toBe(true);
    expect(isAbsoluteUri('https://example.com/?a=%zz')).toBe(true);
    expect(isAbsoluteUri('https://user:pa%41@example.com/')).toBe(true);
    expect(isAbsoluteUri('https://ex%C3%A4mple.com/')).toBe(true);
    expect(isAbsoluteUri('https://exa%25mple.com/')).toBe(true);
    expect(isAbsoluteUri('https://[fe80::1%25en0]:8080/')).toBe(true);
  });

  it("rejects the characters Go's net/url refuses in a host or in user information", () => {
    for (const character of ['{', '}', '|', '\\', '^', '`']) {
      expect(isAbsoluteUri(`https://exa${character}mple.com/events`)).toBe(false);
    }
    expect(isAbsoluteUri('https://exa"mple.com/events')).toBe(true);
    expect(isAbsoluteUri('https://[example.com]/events')).toBe(false);
    expect(isAbsoluteUri('https://us"er@example.com/')).toBe(false);
    expect(isAbsoluteUri('https://us{er@example.com/')).toBe(false);
    expect(isAbsoluteUri('https://\u00fcser@example.com/')).toBe(false);
    expect(isAbsoluteUri("https://user:p@ss!$&'()*+,;=@example.com/")).toBe(true);
    expect(isAbsoluteUri('https://example.com/a{b}|^`')).toBe(true);
  });
});

describe('isRelativeUri', () => {
  it('accepts a path, a query or a fragment without a scheme', () => {
    expect(isRelativeUri('/events')).toBe(true);
    expect(isRelativeUri('events/a:b')).toBe(true);
    expect(isRelativeUri('?id=a:b')).toBe(true);
    expect(isRelativeUri('#a:b')).toBe(true);
    expect(isRelativeUri('//example.com/events')).toBe(true);
  });

  it('rejects a URI with a scheme', () => {
    expect(isRelativeUri('https://example.com')).toBe(false);
    expect(isRelativeUri('mailto:ops@example.com')).toBe(false);
  });

  it("rejects what Go's net/url cannot read without a scheme", () => {
    expect(isRelativeUri(':8080/events')).toBe(false);
    expect(isRelativeUri('8080:x/events')).toBe(false);
    expect(isRelativeUri('a_b:c')).toBe(false);
    expect(isRelativeUri('/events\n')).toBe(false);
    expect(isRelativeUri('/events\t')).toBe(false);
    expect(isRelativeUri('/events ')).toBe(false);
    expect(isRelativeUri('//exa%41mple.com/events')).toBe(false);
    expect(isRelativeUri('//exa{mple.com/events')).toBe(false);
    expect(isRelativeUri('//us"er@example.com/events')).toBe(false);
  });

  it('needs valid percent escapes outside the query', () => {
    expect(isRelativeUri('/%zz')).toBe(false);
    expect(isRelativeUri('events%zz')).toBe(false);
    expect(isRelativeUri('/events#%zz')).toBe(false);
    expect(isRelativeUri('/events?id=%zz')).toBe(true);
    expect(isRelativeUri('/a%2Fb')).toBe(true);
  });
});
