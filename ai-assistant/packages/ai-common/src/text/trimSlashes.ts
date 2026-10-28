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

// These use loops instead of `/\/+$/`-style regexes, which are quadratic on
// long runs of slashes.

/**
 * Removes trailing slashes from a URL-like string.
 *
 * @param value - String to trim.
 * @returns The string without trailing `/` characters.
 */
export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--;
  return value.slice(0, end);
}

/**
 * Removes leading and trailing slashes from a path-like string.
 *
 * @param value - String to trim.
 * @returns The string without leading or trailing `/` characters.
 */
export function trimSlashes(value: string): string {
  let start = 0;
  while (start < value.length && value.charCodeAt(start) === 47) start++;
  return trimTrailingSlashes(value.slice(start));
}
