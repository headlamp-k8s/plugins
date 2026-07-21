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

/** Annotation the provider writes on a Metal3Machine to record the BareMetalHost it claimed. */
export const HOST_ANNOTATION = 'metal3.io/BareMetalHost';

/**
 * Parses the `metal3.io/BareMetalHost` annotation, which stores the claimed host as
 * `"namespace/name"`, into its parts. Returns `null` when the value is absent or is
 * not a well-formed `namespace/name` pair, so callers can fall back to plain text.
 *
 * @param value - The raw annotation value, if present.
 * @returns `{ namespace, name }`, or `null` when it cannot be parsed.
 */
export function parseHostAnnotation(value?: string): { namespace: string; name: string } | null {
  if (!value) {
    return null;
  }
  const [namespace, name, ...rest] = value.split('/');
  if (!namespace || !name || rest.length > 0) {
    return null;
  }
  return { namespace, name };
}
