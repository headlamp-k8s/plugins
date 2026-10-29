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

import {
  createAksSkillsSource,
  createInspektorGadgetSkillsSource,
} from '@headlamp-k8s/ai-common/skills/builtinSources';
import {
  DEFAULT_SKILLS_CONFIG,
  getSkillsConfig,
  getSkillSourceIdentity,
} from '@headlamp-k8s/ai-common/skills/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => {
  const data: Record<string, unknown> = {};
  return { data, update: vi.fn() };
});

vi.mock('../pluginState', () => ({
  pluginStore: { get: () => store.data, update: store.update },
}));

import { seedBuiltinSkillSources } from './seedBuiltinSources';

beforeEach(() => {
  store.data = {};
  store.update.mockReset().mockImplementation((patch: Record<string, unknown>) => {
    store.data = { ...store.data, ...patch };
  });
});

afterEach(() => vi.unstubAllGlobals());

function useAksDesktop(): void {
  vi.stubGlobal('window', { desktopApi: { registerAKSCluster: vi.fn() } });
}

describe('seedBuiltinSkillSources', () => {
  it('seeds only the existing AKS defaults, not Gadget skills, and seeds only once', () => {
    useAksDesktop();
    seedBuiltinSkillSources();
    expect(getSkillsConfig(store.data).sources).toEqual([createAksSkillsSource()]);
    seedBuiltinSkillSources();
    expect(store.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    undefined,
    {},
    { desktopApi: {} },
    { desktopApi: { registerAKSCluster: 'unsupported' } },
  ])('does not seed skills on a non-AKS host: %j', host => {
    vi.stubGlobal('window', host);
    seedBuiltinSkillSources();
    expect(store.update).not.toHaveBeenCalled();
    expect(getSkillsConfig(store.data).sources).toEqual([]);
  });

  it.each([false, true])('preserves an existing Gadget source, customized=%s', customized => {
    useAksDesktop();
    const source = {
      ...createInspektorGadgetSkillsSource(),
      ...(customized ? { ref: 'v0.50.0', sha256: 'a'.repeat(64) } : {}),
      enabled: false,
    };
    store.data = {
      skills: { ...DEFAULT_SKILLS_CONFIG, sources: [source] },
    };
    seedBuiltinSkillSources();
    expect(
      getSkillsConfig(store.data).sources.find(
        entry => getSkillSourceIdentity(entry) === getSkillSourceIdentity(source)
      )
    ).toEqual(source);
  });

  it('preserves manual Gadget opt-in and does not re-enable it after disabling', () => {
    useAksDesktop();
    store.data = {
      skills: { ...DEFAULT_SKILLS_CONFIG, sources: [createInspektorGadgetSkillsSource()] },
    };
    seedBuiltinSkillSources();
    const config = getSkillsConfig(store.data);
    expect(config.sources).toContainEqual(createInspektorGadgetSkillsSource());
    const gadgetIdentity = getSkillSourceIdentity(createInspektorGadgetSkillsSource());
    store.data = {
      ...store.data,
      skills: {
        ...config,
        sources: config.sources.map(source =>
          getSkillSourceIdentity(source) === gadgetIdentity ? { ...source, enabled: false } : source
        ),
      },
    };
    store.update.mockClear();
    seedBuiltinSkillSources();
    expect(
      getSkillsConfig(store.data).sources.find(
        source => getSkillSourceIdentity(source) === gadgetIdentity
      )?.enabled
    ).toBe(false);
    expect(store.update).not.toHaveBeenCalled();
  });

  it('does not restore a manually configured Gadget source after removal', () => {
    useAksDesktop();
    store.data = {
      skills: { ...DEFAULT_SKILLS_CONFIG, sources: [createInspektorGadgetSkillsSource()] },
    };
    seedBuiltinSkillSources();
    expect(getSkillsConfig(store.data).sources).toContainEqual(createInspektorGadgetSkillsSource());
    store.data = {
      ...store.data,
      skills: { ...DEFAULT_SKILLS_CONFIG, sources: [createAksSkillsSource()] },
    };
    store.update.mockClear();
    seedBuiltinSkillSources();
    expect(getSkillsConfig(store.data).sources).toEqual([createAksSkillsSource()]);
    expect(store.update).not.toHaveBeenCalled();
  });
});
