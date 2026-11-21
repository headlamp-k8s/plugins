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

/**
 * Reads a value of a resource draft as a YAML mapping.
 *
 * @param value - Any value from a draft, which the YAML editor may have set to anything.
 * @returns The value when it is an object that is not an array, otherwise an empty object.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...value } : {};
}

/**
 * Reads a string field of a mapping.
 *
 * @param record - The mapping.
 * @param key - The field's name.
 * @returns The field's value when it is a string, otherwise an empty string.
 */
export function stringAt(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Reads the namespace a resource draft is created in.
 *
 * @param resource - The draft.
 * @returns `metadata.namespace`, or an empty string when it is not set.
 */
export function draftNamespace(resource: Record<string, unknown>): string {
  return stringAt(asRecord(resource.metadata), 'namespace');
}

const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;

const AUTHORITY = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/;

const RELATIVE_AUTHORITY = /^\/\/(?!\/)([^/?#]*)/;

const FIRST_SEGMENT_COLON = /^[^/?#]*:/;

const USERINFO = /^[\w.:~!$&'()*+,;=%@-]*$/;

const HOST_AND_PORT = /^(?:\[[\dA-Fa-f:.]*(?:%25[^\]]*)?\]|[^:[\]]*)(?::\d*)?$/;

const REFUSED_HOST_CHARACTER = /[\\^`{|}]/;

const MALFORMED_ESCAPE = /%(?![0-9A-Fa-f]{2})/;

const ASCII_ESCAPE = /%(?!25)[0-7][0-9A-Fa-f]/;

const QUERY = /^([^?#]*)\?[^#]*/;

/**
 * Tells whether a URI has a scheme, which is what makes it absolute for Knative.
 *
 * @param uri - The URI.
 * @returns True when the URI starts with a scheme and a colon, as Go's `url.IsAbs` reads it.
 */
function hasUriScheme(uri: string): boolean {
  return SCHEME.test(uri);
}

/**
 * Tells whether text has white space or a control character, which a URI cannot contain.
 *
 * @param text - The text.
 * @returns True when a space, a character below it, or the delete character appears.
 */
function hasSpaceOrControl(text: string): boolean {
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code <= 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Tells whether every percent sign in a URI starts an escape of two hexadecimal digits, as Go's
 * `net/url` requires everywhere except in the query, which it does not check.
 *
 * @param uri - The URI.
 * @returns True when no percent sign outside the query is incomplete or not hexadecimal.
 */
function hasValidEscapes(uri: string): boolean {
  return !MALFORMED_ESCAPE.test(uri.replace(QUERY, '$1'));
}

/**
 * Tells whether Go's `net/url` accepts the authority of a URI, the part after `//`: user
 * information only of the characters it allows, and a host without the characters it refuses in a
 * host, such as `{` and `|`, or an escape of an ASCII character other than `%25`, followed by a
 * port that is a number. Between brackets it takes only the characters of an IPv6 address and a
 * zone after `%25`.
 *
 * @param authority - The authority.
 * @returns True when Go accepts the authority.
 */
function isValidAuthority(authority: string): boolean {
  const at = authority.lastIndexOf('@');
  const hostAndPort = authority.slice(at + 1);
  return (
    USERINFO.test(authority.slice(0, Math.max(at, 0))) &&
    HOST_AND_PORT.test(hostAndPort) &&
    !REFUSED_HOST_CHARACTER.test(hostAndPort) &&
    !ASCII_ESCAPE.test(hostAndPort)
  );
}

/**
 * Tells whether a URI is absolute with a host, as Knative requires of a destination URI that has
 * no object reference, and whether Go's `net/url`, which Knative uses, can read it. Like Go, it
 * needs `//` after the scheme, so `https:/example.com` has no host, and it checks the authority
 * as {@link isValidAuthority} does and the percent escapes as {@link hasValidEscapes} does. It
 * also refuses white space, such as a space pasted at the end, which a URI cannot contain.
 *
 * @param uri - The URI.
 * @returns True when the URI has a scheme, `//` and a non-empty host, and Go can read it.
 */
export function isAbsoluteUri(uri: string): boolean {
  const authority = AUTHORITY.exec(uri)?.[1];
  return (
    authority !== undefined &&
    authority.slice(authority.lastIndexOf('@') + 1) !== '' &&
    isValidAuthority(authority) &&
    hasValidEscapes(uri) &&
    !hasSpaceOrControl(uri)
  );
}

/**
 * Tells whether a URI is relative and Go's `net/url`, which Knative uses, can read it, as Knative
 * requires of a URI that extends an object reference. Like Go, it refuses a colon in the first
 * path segment, such as in `8080:x/events`, checks an authority after a leading `//` as
 * {@link isValidAuthority} does and the percent escapes as {@link hasValidEscapes} does. It also
 * refuses white space, which a URI cannot contain.
 *
 * @param uri - The URI.
 * @returns True when the URI has no scheme and Go can read it.
 */
export function isRelativeUri(uri: string): boolean {
  if (
    hasUriScheme(uri) ||
    FIRST_SEGMENT_COLON.test(uri) ||
    !hasValidEscapes(uri) ||
    hasSpaceOrControl(uri)
  ) {
    return false;
  }
  const authority = RELATIVE_AUTHORITY.exec(uri)?.[1];
  return authority === undefined || isValidAuthority(authority);
}
