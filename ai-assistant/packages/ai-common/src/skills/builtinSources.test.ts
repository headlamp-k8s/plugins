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

import { describe, expect, it } from 'vitest';
import {
  AKS_SKILLS_PATH,
  AKS_SKILLS_REF,
  AKS_SKILLS_REPO_URL,
  AKS_SKILLS_SHA256,
  createAksSkillsSource,
  createInspektorGadgetSkillsSource,
  INSPEKTOR_GADGET_SKILLS_PATH,
  INSPEKTOR_GADGET_SKILLS_REF,
  INSPEKTOR_GADGET_SKILLS_REPO_URL,
  INSPEKTOR_GADGET_SKILLS_SHA256,
  reconcileBuiltinSkillSources,
} from './builtinSources';
import { DEFAULT_SKILLS_CONFIG, getSkillSourceIdentity, SkillsConfig } from './config';
import { isPinnedRef, isValidGitUrl } from './SkillLoader';

const IDENTITY = getSkillSourceIdentity({
  type: 'git',
  url: AKS_SKILLS_REPO_URL,
  path: AKS_SKILLS_PATH,
});

function emptyConfig(): SkillsConfig {
  return { ...DEFAULT_SKILLS_CONFIG, sources: [] };
}

describe('createAksSkillsSource', () => {
  it('targets only the AKS subdirectory of the Azure skill collection', () => {
    const source = createAksSkillsSource();
    expect(isValidGitUrl(source.url)).toBe(true);
    expect(source.path).toBe('skills/azure-kubernetes');
    expect(source.enabled).toBe(true);
  });

  it('pins an immutable ref with an integrity hash', () => {
    const source = createAksSkillsSource();
    expect(isPinnedRef(source.ref!)).toBe(true);
    expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('createInspektorGadgetSkillsSource', () => {
  it('enables the pinned upstream skills directory with integrity verification', () => {
    const source = createInspektorGadgetSkillsSource();
    expect(source).toEqual({
      type: 'git',
      url: 'https://github.com/inspektor-gadget/inspektor-gadget',
      path: 'skills',
      ref: '47d8e5176a46fd906bc3585bbf9f4786cc440576',
      sha256: INSPEKTOR_GADGET_SKILLS_SHA256,
      includeReferences: true,
      enabled: true,
    });
    expect(isValidGitUrl(source.url)).toBe(true);
    expect(isPinnedRef(source.ref!)).toBe(true);
    expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns independent source objects', () => {
    const source = createInspektorGadgetSkillsSource();
    source.enabled = false;
    expect(createInspektorGadgetSkillsSource().enabled).toBe(true);
  });
});

describe('reconcileBuiltinSkillSources', () => {
  it('adds Gadget skills alongside an already seeded AKS source', () => {
    const config = { ...emptyConfig(), sources: [createAksSkillsSource()] };
    const result = reconcileBuiltinSkillSources(
      config,
      [createAksSkillsSource(), createInspektorGadgetSkillsSource()],
      { [IDENTITY]: { ref: AKS_SKILLS_REF, sha256: AKS_SKILLS_SHA256 } }
    );
    expect(result.config.sources).toEqual([
      createAksSkillsSource(),
      createInspektorGadgetSkillsSource(),
    ]);
    expect(
      result.state[
        getSkillSourceIdentity({
          type: 'git',
          url: INSPEKTOR_GADGET_SKILLS_REPO_URL,
          path: INSPEKTOR_GADGET_SKILLS_PATH,
        })
      ]
    ).toEqual({ ref: INSPEKTOR_GADGET_SKILLS_REF, sha256: INSPEKTOR_GADGET_SKILLS_SHA256 });
  });

  it('adds the built-in source on a fresh configuration', () => {
    const result = reconcileBuiltinSkillSources(emptyConfig(), [createAksSkillsSource()]);

    expect(result.changed).toBe(true);
    expect(result.config.sources).toEqual([createAksSkillsSource()]);
    expect(result.state[IDENTITY]).toEqual({ ref: AKS_SKILLS_REF, sha256: AKS_SKILLS_SHA256 });
  });

  it('reports no change when the source is already current', () => {
    const config: SkillsConfig = { ...emptyConfig(), sources: [createAksSkillsSource()] };
    const result = reconcileBuiltinSkillSources(config, [createAksSkillsSource()], {
      [IDENTITY]: { ref: AKS_SKILLS_REF, sha256: AKS_SKILLS_SHA256 },
    });

    expect(result.changed).toBe(false);
    expect(result.config).toBe(config);
  });

  it('bumps a seeded source to a newer pinned ref', () => {
    const config: SkillsConfig = {
      ...emptyConfig(),
      sources: [{ ...createAksSkillsSource(), ref: 'old-ref', sha256: 'old-hash', enabled: false }],
    };

    const result = reconcileBuiltinSkillSources(config, [createAksSkillsSource()], {
      [IDENTITY]: { ref: 'old-ref', sha256: 'old-hash' },
    });

    expect(result.changed).toBe(true);
    expect(result.config.sources[0]).toMatchObject({
      ref: AKS_SKILLS_REF,
      sha256: AKS_SKILLS_SHA256,
      enabled: false,
    });
  });

  it('leaves a seeded source alone once the user repinned it', () => {
    const config: SkillsConfig = {
      ...emptyConfig(),
      sources: [{ ...createAksSkillsSource(), ref: 'user-ref', sha256: 'user-hash' }],
    };

    const result = reconcileBuiltinSkillSources(config, [createAksSkillsSource()], {
      [IDENTITY]: { ref: 'old-ref', sha256: 'old-hash' },
    });

    expect(result.changed).toBe(false);
    expect(result.config.sources[0].ref).toBe('user-ref');
  });

  it('does not restore a source the user removed', () => {
    const result = reconcileBuiltinSkillSources(emptyConfig(), [createAksSkillsSource()], {
      [IDENTITY]: { ref: AKS_SKILLS_REF, sha256: AKS_SKILLS_SHA256 },
    });

    expect(result.changed).toBe(false);
    expect(result.config.sources).toEqual([]);
  });

  it('does not adopt a same-location source the user configured', () => {
    const config: SkillsConfig = {
      ...emptyConfig(),
      sources: [{ type: 'git', url: AKS_SKILLS_REPO_URL, path: AKS_SKILLS_PATH, enabled: true }],
    };

    const result = reconcileBuiltinSkillSources(config, [createAksSkillsSource()]);

    expect(result.changed).toBe(false);
    expect(result.config.sources[0].ref).toBeUndefined();
  });

  it('preserves unrelated sources', () => {
    const other = { type: 'local' as const, url: '/home/user/skills', enabled: true };
    const config: SkillsConfig = { ...emptyConfig(), sources: [other] };

    const result = reconcileBuiltinSkillSources(config, [createAksSkillsSource()]);

    expect(result.config.sources).toHaveLength(2);
    expect(result.config.sources[0]).toEqual(other);
  });
});
