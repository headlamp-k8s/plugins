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

import { SkillSource } from './SkillLoader';

/**
 * Persisted configuration for the skills system.
 *
 * Stored alongside other AI assistant settings (provider config, tool config).
 */
export interface SkillsConfig {
  /** Configured skill sources (local directories and Git repositories). */
  sources: SkillSource[];
  /** Names of skills that are explicitly disabled by the user. */
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
type PluginDataWithSkills = PluginData & { skills: SkillsConfig };

/**
 * Reads the skills configuration from persisted plugin data.
 *
 * @param data - Raw plugin data store object.
 * @returns The stored skills configuration, or defaults if none exists.
 */
export function getSkillsConfig(data: unknown): SkillsConfig {
  if (!data || typeof data !== 'object' || !('skills' in data)) {
    return { ...DEFAULT_SKILLS_CONFIG };
  }

  const stored = data.skills;
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_SKILLS_CONFIG };
  }
  const storedConfig = stored as Record<string, unknown>;
  return {
    sources: Array.isArray(storedConfig.sources) ? (storedConfig.sources as SkillSource[]) : [],
    disabledSkills: Array.isArray(storedConfig.disabledSkills)
      ? storedConfig.disabledSkills.filter((value): value is string => typeof value === 'string')
      : [],
    maxSkillSizeBytes:
      typeof storedConfig.maxSkillSizeBytes === 'number'
        ? storedConfig.maxSkillSizeBytes
        : DEFAULT_SKILLS_CONFIG.maxSkillSizeBytes,
    maxTotalSkillSizeBytes:
      typeof storedConfig.maxTotalSkillSizeBytes === 'number'
        ? storedConfig.maxTotalSkillSizeBytes
        : DEFAULT_SKILLS_CONFIG.maxTotalSkillSizeBytes,
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
  const exists = config.sources.some(s => s.url === source.url && s.path === source.path);
  if (exists) {
    throw new Error(`Skill source already exists: ${source.url}`);
  }

  return {
    ...config,
    sources: [...config.sources, source],
  };
}

/**
 * Removes a skill source from the configuration by URL.
 *
 * @param config - Current skills configuration.
 * @param url - URL of the source to remove.
 * @param path - Optional path qualifier for disambiguation.
 * @returns Updated configuration without the source.
 */
export function removeSkillSource(
  config: SkillsConfig,
  url: string,
  sourcePath?: string
): SkillsConfig {
  return {
    ...config,
    sources: config.sources.filter(s => {
      if (s.url !== url) return true;
      // When sourcePath is provided, only remove the source with that exact path.
      if (sourcePath !== undefined) return s.path !== sourcePath;
      // When no sourcePath given, remove all sources with this URL.
      return false;
    }),
  };
}

/**
 * Toggles a skill's enabled/disabled state.
 *
 * @param config - Current skills configuration.
 * @param skillName - Name of the skill to toggle.
 * @returns Updated configuration with the skill toggled.
 */
export function toggleSkill(config: SkillsConfig, skillName: string): SkillsConfig {
  const isDisabled = config.disabledSkills.includes(skillName);

  return {
    ...config,
    disabledSkills: isDisabled
      ? config.disabledSkills.filter(n => n !== skillName)
      : [...config.disabledSkills, skillName],
  };
}

/**
 * Checks whether a skill is enabled.
 *
 * @param config - Current skills configuration.
 * @param skillName - Name of the skill to check.
 * @returns True if the skill is enabled (not in the disabled list).
 */
export function isSkillEnabled(config: SkillsConfig, skillName: string): boolean {
  return !config.disabledSkills.includes(skillName);
}
