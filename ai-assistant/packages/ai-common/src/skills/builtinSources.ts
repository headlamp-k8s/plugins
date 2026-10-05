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

import { getSkillSourceIdentity, SkillsConfig } from './config';
import type { SkillSource } from './SkillLoader';

/** Repository publishing the Microsoft-authored Azure skill collection. */
export const AKS_SKILLS_REPO_URL = 'https://github.com/microsoft/azure-skills';

/** Subdirectory holding the AKS skills, so the other Azure skills stay out. */
export const AKS_SKILLS_PATH = 'skills/azure-kubernetes';

/** Pinned commit of {@link AKS_SKILLS_REPO_URL}, matching {@link AKS_SKILLS_SHA256}. */
export const AKS_SKILLS_REF = '66cd9273ed146a311699898596bc916711494481';

/**
 * Content hash of the markdown under {@link AKS_SKILLS_PATH} at {@link AKS_SKILLS_REF}.
 *
 * Recompute with `computeContentHash()` over the fetched files whenever the ref
 * is bumped; the loader rejects the source when it fails to match.
 */
export const AKS_SKILLS_SHA256 = '227f6be516801a63e6ab5dbe9f65457d1c7c80ab59b71cbab89eb634b3a91520';

/** @returns The AKS skill source preconfigured on AKS Desktop. */
export function createAksSkillsSource(): SkillSource {
  return {
    type: 'git',
    url: AKS_SKILLS_REPO_URL,
    path: AKS_SKILLS_PATH,
    ref: AKS_SKILLS_REF,
    sha256: AKS_SKILLS_SHA256,
    enabled: true,
  };
}

/** Definition last written for one built-in skill source. */
export interface BuiltinSkillSourceDefinition {
  /** Pinned Git ref fetched for the source. */
  ref?: string;
  /** Expected content hash of the fetched skill files. */
  sha256?: string;
}

/** Built-in skill source definitions last written, keyed by source identity. */
export type BuiltinSkillSourceState = Record<string, BuiltinSkillSourceDefinition>;

/** Outcome of reconciling built-in skill sources against persisted settings. */
export interface ReconcileBuiltinSkillSourcesResult {
  /** Settings to persist, unchanged by identity when nothing needed updating. */
  config: SkillsConfig;
  /** Definitions written for built-in sources, to persist alongside the settings. */
  state: BuiltinSkillSourceState;
  /** Whether the settings differ from the supplied ones. */
  changed: boolean;
}

/** @returns Whether two built-in source definitions describe the same content. */
function isSameDefinition(
  a: BuiltinSkillSourceDefinition,
  b: BuiltinSkillSourceDefinition
): boolean {
  return a.ref === b.ref && a.sha256 === b.sha256;
}

/** @returns The reconcilable fields of a skill source. */
function toDefinition(source: SkillSource): BuiltinSkillSourceDefinition {
  return { ref: source.ref, sha256: source.sha256 };
}

/**
 * Adds built-in skill sources and keeps their pinned refs current.
 *
 * Sources the user removed are not restored, and sources the user retargeted or
 * configured themselves are left alone, so seeding never fights manual edits.
 *
 * @param config - Persisted skills settings.
 * @param builtinSources - Sources the host preconfigures.
 * @param previousState - Definitions written on an earlier run.
 * @returns Settings to persist, the definitions written, and whether anything changed.
 */
export function reconcileBuiltinSkillSources(
  config: SkillsConfig,
  builtinSources: readonly SkillSource[],
  previousState: BuiltinSkillSourceState = {}
): ReconcileBuiltinSkillSourcesResult {
  const sources = [...config.sources];
  const state: BuiltinSkillSourceState = { ...previousState };
  let changed = false;

  for (const builtin of builtinSources) {
    const identity = getSkillSourceIdentity(builtin);
    const definition = toDefinition(builtin);
    const index = sources.findIndex(source => getSkillSourceIdentity(source) === identity);
    const lastWritten = previousState[identity];
    const seeded = identity in previousState;

    if (index === -1) {
      // A source that is gone after being seeded was removed by the user.
      if (seeded) continue;
      sources.push({ ...builtin });
      state[identity] = definition;
      changed = true;
      continue;
    }

    // The user configured this repository themselves, so leave it untouched.
    if (!seeded) continue;

    const existing = toDefinition(sources[index]);
    if (!isSameDefinition(existing, lastWritten)) continue;
    if (isSameDefinition(existing, definition)) continue;

    sources[index] = { ...sources[index], ...definition };
    state[identity] = definition;
    changed = true;
  }

  if (!changed) {
    return { config, state, changed };
  }

  return { config: { ...config, sources }, state, changed };
}
