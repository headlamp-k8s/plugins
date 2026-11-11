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

import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';
import { getKnativeCrdName, type KnativeResourceClass } from './customResourceLinks';

/**
 * How the plugin finds the kinds of one family of resources, such as every kind of Source: by a
 * label on their CRDs, or as Knative's own kinds where the CRDs cannot be read.
 */
export interface DiscoveredKindFamily<C> {
  /** The label that marks the CRDs of the family's kinds, set to `true`. */
  labelKey: string;
  /** Names of labelled CRDs that are not part of the family. */
  excludedCrds?: string[];
  /** Knative's own kinds, used where the CRDs cannot be read. */
  fallbackKinds: KnativeResourceClass[];
  /** Gives the class for one kind, the same class each time for the same kind. */
  getKindClass: (info: KnativeResourceClass) => C;
}

/**
 * A resource of a kind the plugin finds through a CRD label, such as a Source or a channel
 * implementation. Its page reads the kind from the CRD, so its link names the CRD.
 */
export abstract class DiscoveredKindResource<
  T extends KubeObjectInterface & { status?: ConditionedStatus }
> extends ConditionedKnativeCustomResource<T> {
  /**
   * Builds the link to this resource's detail page, which names the resource's CRD in its query.
   *
   * @returns The URL of the class's detail route.
   */
  getDetailsLink(): string {
    const query = new URLSearchParams({ crd: getKnativeCrdName(this._class()) });
    return `${super.getDetailsLink()}?${query}`;
  }

  /**
   * Gives the spec without the fields the page shows in their own rows or sections, as written.
   *
   * @param shownFields - The fields to leave out.
   * @returns The other fields, or undefined when there are none.
   */
  protected getSpecWithout(...shownFields: string[]): Record<string, unknown> | undefined {
    const settings = Object.entries(this.spec ?? {}).filter(
      ([field]) => !shownFields.includes(field)
    );
    return settings.length > 0 ? Object.fromEntries(settings) : undefined;
  }
}

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
