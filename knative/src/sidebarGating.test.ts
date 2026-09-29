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

import { vi } from 'vitest';
import type { KnativeComponent } from './isKnativeInstalled';
import { knativeNavigationSections } from './navigation';
import { componentsForEntry, createSidebarGate, SECTION_COMPONENT } from './sidebarGating';

const root = { name: 'knative', parent: null };
const section = { name: 'knative-serving', parent: 'knative' };
const kservices = { name: 'knative-services', parent: 'knative-serving' };
const foreign = { name: 'workloads', parent: null };

/** Lets the queued install checks settle before the next assertion. */
async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('componentsForEntry', () => {
  it('leaves entries from other plugins alone', () => {
    expect(componentsForEntry(foreign)).toBeNull();
    expect(componentsForEntry({ name: 'workloads', parent: 'something-else' })).toBeNull();
  });

  it('gates each section on the component it needs', () => {
    expect(componentsForEntry(section)).toEqual(['serving']);
    expect(componentsForEntry({ name: 'knative-configuration', parent: 'knative' })).toEqual([
      'serving',
    ]);
  });

  it('gives an item the component of the section it sits in', () => {
    expect(componentsForEntry(kservices)).toEqual(['serving']);
    expect(
      componentsForEntry({ name: 'knative-certificates', parent: 'knative-serving-internals' })
    ).toEqual(['serving']);
  });

  it('falls back to Serving for an entry navigation does not describe', () => {
    expect(componentsForEntry({ name: 'not-mapped-yet', parent: 'knative' })).toEqual(['serving']);
    expect(componentsForEntry({ name: 'new-item', parent: 'knative-serving' })).toEqual([
      'serving',
    ]);
  });

  it('does not read anything off the prototype chain', () => {
    // An entry named after an Object member must still resolve to a component
    // rather than to whatever that member happens to be.
    ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'].forEach(name => {
      expect(componentsForEntry({ name, parent: 'knative' })).toEqual(['serving']);
    });
  });

  it('gates the top level entry on every component its sections need', () => {
    const rootComponents = componentsForEntry(root);
    expect(rootComponents).not.toBeNull();

    // The top level entry has to cover each section, otherwise it can be shown
    // with every section under it filtered out.
    SECTION_COMPONENT.forEach(component => {
      expect(rootComponents).toContain(component);
    });
  });

  it('lists each component once', () => {
    const rootComponents = componentsForEntry(root)!;
    expect(rootComponents).toEqual(Array.from(new Set(rootComponents)));
  });
});

describe('every registered Knative sidebar entry', () => {
  // The entries the plugin actually registers in index.tsx, in the same shape
  // the sidebar filter sees them.
  const registered = [
    { name: 'knative', parent: null },
    ...knativeNavigationSections.flatMap(navSection => [
      { name: navSection.name, parent: 'knative' },
      ...navSection.items.map(item => ({ name: item.name, parent: navSection.name })),
    ]),
  ];

  it.each(registered)('$name is gated on a known component', entry => {
    const components = componentsForEntry(entry);
    expect(components).not.toBeNull();
    expect(components!.length).toBeGreaterThan(0);
    components!.forEach(component => expect(['serving', 'eventing']).toContain(component));
  });

  it('shows all of them when the components they need are installed', async () => {
    const isInstalled = vi.fn(async () => true);
    const gate = createSidebarGate({ getCluster: () => 'a', isInstalled });

    registered.forEach(entry => gate(entry));
    await settle();

    registered.forEach(entry => expect(gate(entry)).toBe(entry));
  });

  it('hides all of them when Knative is absent', async () => {
    const isInstalled = vi.fn(async () => false);
    const gate = createSidebarGate({ getCluster: () => 'a', isInstalled });

    registered.forEach(entry => gate(entry));
    await settle();

    registered.forEach(entry => expect(gate(entry)).toBeNull());
  });
});

describe('createSidebarGate', () => {
  /**
   * Builds a gate over a cluster with a fixed set of installed components.
   *
   * @param installedComponents The components the cluster is running.
   * @param cluster The cluster name reported to the gate.
   */
  function gateFor(installedComponents: KnativeComponent[], cluster = 'a') {
    const isInstalled = vi.fn(async (component: KnativeComponent) =>
      installedComponents.includes(component)
    );
    const gate = createSidebarGate({ getCluster: () => cluster, isInstalled });
    return { gate, isInstalled };
  }

  it('never touches entries from other plugins', async () => {
    const { gate, isInstalled } = gateFor([]);
    expect(gate(foreign)).toBe(foreign);
    await settle();
    expect(isInstalled).not.toHaveBeenCalled();
  });

  it('keeps entries visible while the first check is in flight', () => {
    const { gate } = gateFor([]);
    expect(gate(root)).toBe(root);
    expect(gate(kservices)).toBe(kservices);
  });

  it('shows Serving sections when Serving is installed', async () => {
    const { gate } = gateFor(['serving']);
    gate(kservices);
    await settle();
    expect(gate(kservices)).toBe(kservices);
    expect(gate(root)).toBe(root);
  });

  it('hides Serving sections when Serving is missing', async () => {
    const { gate } = gateFor([]);
    gate(kservices);
    await settle();
    expect(gate(kservices)).toBeNull();
  });

  it('hides the top level entry only when every section is hidden', async () => {
    const { gate } = gateFor([]);
    gate(root);
    await settle();
    expect(gate(root)).toBeNull();
  });

  it('checks exactly the components the sections need, and no others', async () => {
    const { gate, isInstalled } = gateFor(['serving']);
    gate(root);
    gate(kservices);
    await settle();

    const checked = isInstalled.mock.calls.map(([component]) => component);
    expect(checked).toContain('serving');

    // Gating per component must not cost extra lookups. Nothing needs Eventing
    // yet, so nothing should be asking about it.
    expect(new Set(checked)).toEqual(new Set(SECTION_COMPONENT.values()));
  });

  it('reuses a result until the cache expires', async () => {
    let clock = 0;
    const isInstalled = vi.fn(async () => true);
    const gate = createSidebarGate({
      getCluster: () => 'a',
      isInstalled,
      now: () => clock,
      ttlMs: 1000,
    });

    gate(kservices);
    await settle();
    const afterFirst = isInstalled.mock.calls.length;

    clock = 500;
    gate(kservices);
    await settle();
    expect(isInstalled.mock.calls).toHaveLength(afterFirst);

    clock = 2000;
    gate(kservices);
    await settle();
    expect(isInstalled.mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it('caches per cluster as well as per component', async () => {
    let cluster = 'a';
    const isInstalled = vi.fn(async () => cluster === 'a');
    const gate = createSidebarGate({ getCluster: () => cluster, isInstalled });

    gate(kservices);
    await settle();
    expect(gate(kservices)).toBe(kservices);

    cluster = 'b';
    gate(kservices);
    await settle();
    expect(gate(kservices)).toBeNull();

    // Switching back uses the earlier result rather than checking again.
    cluster = 'a';
    expect(gate(kservices)).toBe(kservices);
  });

  it('runs one check at a time for the same key', async () => {
    let resolveCheck: (value: boolean) => void = () => {};
    const isInstalled = vi.fn(
      () =>
        new Promise<boolean>(resolve => {
          resolveCheck = resolve;
        })
    );
    const gate = createSidebarGate({ getCluster: () => 'a', isInstalled });

    gate(kservices);
    gate(kservices);
    gate(kservices);
    expect(isInstalled).toHaveBeenCalledTimes(1);

    resolveCheck(true);
    await settle();
  });

  it('stops blocking further checks when one rejects', async () => {
    const isInstalled = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(true);
    let clock = 0;
    const gate = createSidebarGate({
      getCluster: () => 'a',
      isInstalled,
      now: () => clock,
      ttlMs: 1000,
    });

    gate(kservices);
    await settle();

    clock = 2000;
    gate(kservices);
    await settle();
    expect(isInstalled).toHaveBeenCalledTimes(2);
  });
});
