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

import type { ParsedSkill } from './parseSkill';
import { isValidGitUrl, SkillSource } from './SkillLoader';

/**
 * Persisted configuration for the skills system.
 *
 * Stored alongside other AI assistant settings (provider config, tool config).
 */
export interface SkillsConfig {
  /** Configured skill sources (local directories and Git repositories). */
  sources: SkillSource[];
  /** Canonical source-plus-name identities of skills explicitly disabled by the user. */
  disabledSkills: string[];
  /** Maximum content size per skill in bytes. */
  maxSkillSizeBytes: number;
  /** Maximum total prompt skill content in bytes. */
  maxTotalSkillSizeBytes: number;
}

/** Default configuration when no skills have been configured. */
export const DEFAULT_SKILLS_CONFIG: SkillsConfig = {
  sources: [],
  disabledSkills: [],
  maxSkillSizeBytes: 50 * 1024,
  maxTotalSkillSizeBytes: 200 * 1024,
};

/** Unvalidated persisted plugin data keyed by feature name. */
type PluginData = Record<string, unknown>;
/** Plugin data returned after a validated skills configuration is stored. */
type PluginDataWithSkills = PluginData & {
  /** Validated skills configuration stored with the plugin data. */
  skills: SkillsConfig;
};

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns a finite positive number, or the supplied fallback for invalid persisted values. */
function positiveNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Normalizes a filesystem path or Git URL used as a skill source location.
 *
 * @param value - Persisted or user-entered location.
 * @param type - Source type controlling path or URL normalization.
 * @returns Canonical source location.
 */
export function normalizeSkillSourceUrl(value: string, type: SkillSource['type']): string {
  const trimmed = value.trim();
  if (type === 'git') {
    try {
      const parsed = new URL(trimmed);
      const pathname = parsed.pathname.replace(/\/+$/, '').replace(/\.git$/i, '');
      return `${parsed.origin}${pathname}`;
    } catch {
      return trimmed.replace(/\/+$/, '').replace(/\.git$/i, '');
    }
  }
  return trimmed === '/' || /^[A-Za-z]:[\\/]?$/.test(trimmed)
    ? trimmed
    : trimmed.replace(/[\\/]+$/, '');
}

/** @returns Canonical optional Git subdirectory without surrounding separators. */
export function normalizeSkillSourcePath(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^[\\/]+|[\\/]+$/g, '');
  return normalized || undefined;
}

/** @returns Whether a source URL is a canonical credential-free GitHub repository URL. */
export function isValidSkillSourceGitUrl(value: string): boolean {
  return isValidGitUrl(value);
}

/**
 * Returns a collision-safe identity for one source, including its Git subdirectory.
 *
 * @param source - Source identity fields.
 * @returns Serialized canonical type, location, and subdirectory tuple.
 */
export function getSkillSourceIdentity(source: Pick<SkillSource, 'type' | 'url' | 'path'>): string {
  return JSON.stringify([
    source.type,
    normalizeSkillSourceUrl(source.url, source.type),
    source.type === 'git' ? normalizeSkillSourcePath(source.path) ?? '' : '',
  ]);
}

/**
 * Validates and normalizes an untrusted persisted skill source.
 *
 * @param value - Untrusted persisted value.
 * @returns Canonical source, or `null` when invalid or unsafe.
 */
export function normalizeSkillSource(value: unknown): SkillSource | null {
  if (
    !isRecord(value) ||
    (value.type !== 'local' && value.type !== 'git') ||
    typeof value.url !== 'string' ||
    typeof value.enabled !== 'boolean'
  ) {
    return null;
  }
  if (value.type === 'git' && !isValidSkillSourceGitUrl(value.url.trim())) return null;
  const url = normalizeSkillSourceUrl(value.url, value.type);
  if (!url) return null;
  if (value.type === 'local') {
    if (!url.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(url)) return null;
    return { type: 'local', url, enabled: value.enabled };
  }
  if (value.sha256 !== undefined && typeof value.sha256 !== 'string') return null;
  const sha256 = typeof value.sha256 === 'string' ? value.sha256.trim().toLowerCase() : '';
  if (sha256 && !/^[a-fA-F0-9]{64}$/.test(sha256)) return null;
  const ref = typeof value.ref === 'string' ? value.ref.trim() : '';
  const path = typeof value.path === 'string' ? normalizeSkillSourcePath(value.path) : undefined;
  return {
    type: 'git',
    url,
    enabled: value.enabled,
    ...(ref ? { ref } : {}),
    ...(path ? { path } : {}),
    ...(sha256 ? { sha256 } : {}),
  };
}

/**
 * Reads the skills configuration from persisted plugin data.
 *
 * @param data - Raw plugin data store object.
 * @returns The stored skills configuration, or defaults if none exists.
 */
export function getSkillsConfig(data: unknown): SkillsConfig {
  if (!isRecord(data) || !isRecord(data.skills)) {
    return { ...DEFAULT_SKILLS_CONFIG };
  }
  const storedConfig = data.skills;
  const seenSources = new Set<string>();
  const sources = Array.isArray(storedConfig.sources)
    ? storedConfig.sources.flatMap(value => {
        const source = normalizeSkillSource(value);
        if (!source) return [];
        const identity = getSkillSourceIdentity(source);
        if (seenSources.has(identity)) return [];
        seenSources.add(identity);
        return [source];
      })
    : [];
  return {
    sources,
    disabledSkills: Array.isArray(storedConfig.disabledSkills)
      ? [...new Set(storedConfig.disabledSkills.filter(isSkillIdentity))]
      : [],
    maxSkillSizeBytes: positiveNumberOr(
      storedConfig.maxSkillSizeBytes,
      DEFAULT_SKILLS_CONFIG.maxSkillSizeBytes
    ),
    maxTotalSkillSizeBytes: positiveNumberOr(
      storedConfig.maxTotalSkillSizeBytes,
      DEFAULT_SKILLS_CONFIG.maxTotalSkillSizeBytes
    ),
  };
}

/**
 * Saves skills configuration to the plugin data store.
 *
 * @param data - Raw plugin data store object to update.
 * @param config - Skills configuration to save.
 * @returns Updated data object with the skills config merged in.
 */
export function saveSkillsConfig(data: PluginData, config: SkillsConfig): PluginDataWithSkills {
  return {
    ...data,
    skills: {
      sources: config.sources,
      disabledSkills: config.disabledSkills,
      maxSkillSizeBytes: config.maxSkillSizeBytes,
      maxTotalSkillSizeBytes: config.maxTotalSkillSizeBytes,
    },
  };
}

/**
 * Adds a new skill source to the configuration.
 *
 * Prevents duplicate sources by checking the URL.
 *
 * @param config - Current skills configuration.
 * @param source - New source to add.
 * @returns Updated configuration with the source added.
 * @throws If a source with the same URL already exists.
 */
export function addSkillSource(config: SkillsConfig, source: SkillSource): SkillsConfig {
  const identity = getSkillSourceIdentity(source);
  const exists = config.sources.some(s => getSkillSourceIdentity(s) === identity);
  if (exists) {
    throw new Error(`Skill source already exists: ${source.url}`);
  }

  return {
    ...config,
    sources: [...config.sources, source],
  };
}

/**
 * Removes one skill source by its canonical type, URL, and path identity.
 *
 * @param config - Current skills configuration.
 * @param source - Source identity to remove.
 * @returns Updated configuration without the source.
 */
export function removeSkillSource(
  config: SkillsConfig,
  source: Pick<SkillSource, 'type' | 'url' | 'path'>
): SkillsConfig {
  const identity = getSkillSourceIdentity(source);
  return {
    ...config,
    sources: config.sources.filter(value => getSkillSourceIdentity(value) !== identity),
  };
}

/**
 * Returns the canonical identity used for per-skill settings.
 *
 * @param skill - Parsed skill with source and metadata.
 * @returns Serialized source and skill-name tuple.
 */
export function getSkillIdentity(skill: Pick<ParsedSkill, 'source' | 'metadata'>): string {
  return JSON.stringify([skill.source, skill.metadata.name]);
}

/** @returns Whether persisted data is a canonical serialized skill identity. */
function isSkillIdentity(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const parsed: unknown = JSON.parse(value);
    return (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every(part => typeof part === 'string' && part.length > 0)
    );
  } catch {
    return false;
  }
}

/**
 * Toggles a skill's enabled/disabled state.
 *
 * @param config - Current skills configuration.
 * @param skill - Parsed skill to toggle.
 * @returns Updated configuration with the skill toggled.
 */
export function toggleSkill(config: SkillsConfig, skill: ParsedSkill): SkillsConfig {
  const identity = getSkillIdentity(skill);
  const isDisabled = config.disabledSkills.includes(identity);

  return {
    ...config,
    disabledSkills: isDisabled
      ? config.disabledSkills.filter(value => value !== identity)
      : [...config.disabledSkills, identity],
  };
}

/**
 * Checks whether a skill is enabled.
 *
 * @param config - Current skills configuration.
 * @param skill - Parsed skill to check.
 * @returns True if the skill is enabled (not in the disabled list).
 */
export function isSkillEnabled(config: SkillsConfig, skill: ParsedSkill): boolean {
  return !config.disabledSkills.includes(getSkillIdentity(skill));
}
