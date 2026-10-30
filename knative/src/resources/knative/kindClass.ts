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

import type { KnativeResourceClass } from './customResourceLinks';

/**
 * Gives the class for one kind, building it the first time and reusing it afterwards. The same
 * kind, plural name, scope and API version always give the same class, so a list of that kind
 * keeps its watch while its CRD changes in other ways.
 *
 * @param classes - The classes built so far.
 * @param info - The kind, its plural name, scope and the API version to request.
 * @param build - Builds the class for the kind.
 * @returns The class.
 */
export function getKindClass<T>(
  classes: Map<string, T>,
  info: KnativeResourceClass,
  build: () => T
): T {
  const key = JSON.stringify([info.kind, info.apiName, info.apiVersion, info.isNamespaced]);
  const existing = classes.get(key);
  if (existing) {
    return existing;
  }

  const kindClass = build();
  classes.set(key, kindClass);
  return kindClass;
}
