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

import type { KnativeComponent } from './isKnativeInstalled';
import { knativeNavigationSections } from './navigation';

/** The name of the top level Knative sidebar entry. */
const KNATIVE_ROOT_ENTRY = 'knative';

/**
 * The Knative component each navigation section needs.
 *
 * A section is only useful when the component that serves its resources is
 * installed, so this is what its entries are gated on. Adding an Eventing
 * section to navigation.ts means adding one line here.
 *
 * A Map rather than an object so that a lookup can only ever return something
 * that was put here, whatever an entry happens to be called.
 */
export const SECTION_COMPONENT = new Map<string, KnativeComponent>([
  ['knative-serving', 'serving'],
  ['knative-serving-internals', 'serving'],
  ['knative-configuration', 'serving'],
]);

const DEFAULT_SECTION_COMPONENT: KnativeComponent = 'serving';

/**
 * Every named entry the plugin registers, mapped to the component it needs.
 *
 * Items inherit the component of the section they sit in, so the sections stay
 * the only place a component is decided.
 */
const ENTRY_COMPONENT = new Map<string, KnativeComponent>([
  ...SECTION_COMPONENT,
  ...knativeNavigationSections.flatMap(section => {
    const component = SECTION_COMPONENT.get(section.name) ?? DEFAULT_SECTION_COMPONENT;
    return section.items.map(item => [item.name, component] as [string, KnativeComponent]);
  }),
]);

/** The components at least one entry needs, without duplicates. */
const NEEDED_COMPONENTS = Array.from(new Set(ENTRY_COMPONENT.values()));

/** How long an install check is reused before it is made again. */
const CHECK_TTL_MS = 30 * 1000;

/** The shape of a sidebar entry this module needs to make a decision. */
interface SidebarEntryLike {
  name: string;
  parent?: string | null;
}

/**
 * Builds the key a check result is cached under.
 *
 * @param cluster The cluster the check was made against.
 * @param component The component that was looked for.
 * @returns The cache key.
 */
function cacheKey(cluster: string, component: KnativeComponent) {
  return `${cluster}/${component}`;
}

export interface SidebarGateOptions {
  /** Returns the cluster the sidebar is being rendered for. */
  getCluster: () => string;
  /** Checks whether a component is installed in the given clusters. */
  isInstalled: (component: KnativeComponent, clusters: string[]) => Promise<boolean>;
  /** Reads the current time. Injectable for tests. */
  now?: () => number;
  /** How long a result is reused before it is checked again. */
  ttlMs?: number;
}

/**
 * Returns the components an entry depends on, or null when the entry does not
 * belong to this plugin.
 *
 * The top level entry depends on every component the sections need, so that it
 * is hidden exactly when all of them would be hidden. Headlamp keeps a parent
 * whose children have all been filtered out, and a parent with no children
 * links nowhere, so the top level entry must not outlive its sections.
 *
 * @param entry The sidebar entry being filtered.
 * @returns The components to check, or null to leave the entry alone.
 */
export function componentsForEntry(entry: SidebarEntryLike): KnativeComponent[] | null {
  if (entry.name === KNATIVE_ROOT_ENTRY) {
    return NEEDED_COMPONENTS;
  }

  const component = ENTRY_COMPONENT.get(entry.name);
  if (component !== undefined) {
    return [component];
  }

  // An entry registered under Knative that navigation.ts does not describe.
  const parent = entry.parent ?? '';
  if (parent === KNATIVE_ROOT_ENTRY || SECTION_COMPONENT.has(parent)) {
    return [DEFAULT_SECTION_COMPONENT];
  }

  return null;
}

/**
 * Builds a sidebar entry filter that hides Knative entries whose component is
 * not installed.
 *
 * Results are cached per cluster and component for a short time, and only one
 * check per key is in flight at once. An entry stays visible until a check has
 * come back negative, so nothing flickers out and back while the first lookup
 * is running.
 *
 * @param options Cluster lookup and the injectable pieces used by tests.
 * @returns A filter for registerSidebarEntryFilter.
 */
export function createSidebarGate(options: SidebarGateOptions) {
  const { getCluster, isInstalled, now = Date.now, ttlMs = CHECK_TTL_MS } = options;

  const installed: Record<string, boolean> = {};
  const lastCheckedAt: Record<string, number> = {};
  const inFlight: Record<string, boolean> = {};

  async function check(cluster: string, component: KnativeComponent) {
    const key = cacheKey(cluster, component);
    const lastChecked = lastCheckedAt[key];
    // A key that has never been checked is not fresh, whatever the clock reads.
    const fresh = lastChecked !== undefined && now() - lastChecked < ttlMs;
    if (inFlight[key] || fresh) {
      return;
    }

    inFlight[key] = true;
    try {
      installed[key] = await isInstalled(component, [cluster]);
    } catch {
      // A failed check is not evidence either way. The entry stays visible and
      // the check is made again once the cached result expires.
    } finally {
      lastCheckedAt[key] = now();
      inFlight[key] = false;
    }
  }

  return function gate<T extends SidebarEntryLike>(entry: T): T | null {
    const components = componentsForEntry(entry);
    if (components === null) {
      return entry;
    }

    const cluster = getCluster();
    components.forEach(component => void check(cluster, component));

    const allKnownMissing = components.every(
      component => installed[cacheKey(cluster, component)] === false
    );

    return allKnownMissing ? null : entry;
  };
}
