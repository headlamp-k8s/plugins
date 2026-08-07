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

import { isSkillEnabled, SkillsConfig } from './config';
import { formatSkillsForPrompt, ParsedSkill } from './parseSkill';
import { EmbeddingSkillRouter } from './routing/EmbeddingSkillRouter';
import {
  DEFAULT_ROUTER_CONFIG,
  routeAndFormatSkills,
  SkillRouterConfig,
} from './routing/KeywordSkillRouter';
import { SkillFileSystem, SkillHttpClient, SkillLoader, SkillZipExtractor } from './SkillLoader';

/** Optional per-source cache shared across SkillManager instances. */
export interface SkillCache {
  /** Returns cached parsed skills, or null when the source is not cached. */
  get(key: string): Promise<ParsedSkill[] | null>;
  /** Stores parsed skills for a source. */
  set(key: string, skills: ParsedSkill[]): Promise<void>;
  /** Removes one source entry before an explicit reload. */
  delete?(key: string): Promise<void>;
}

/** Per-source error reported during skill loading. */
export interface SkillLoadError {
  /** URL or path of the source that failed to load. */
  sourceUrl: string;
  /** Configured source transport or location type. */
  sourceType: string;
  /** Human-readable loading failure message. */
  error: string;
}

/**
 * Coordinates skill loading, caching, filtering, and prompt injection.
 *
 * This is the main entry point for the skills system. It uses a
 * {@link SkillLoader} to fetch skills from configured sources, filters
 * them based on the user's enabled/disabled preferences, and generates
 * the prompt text to inject into the system prompt.
 */
export class SkillManager {
  private loader: SkillLoader;
  private cachedSkills: Map<string, ParsedSkill[]> = new Map();
  private lastLoadTimestamp: number = 0;
  private lastSourcesKey: string = '';
  private lastMaxSkillSizeBytes: number = 0;
  private reloadRequired: boolean = false;

  /** Cache TTL in milliseconds (default: 1 hour). */
  private cacheTtlMs: number;

  private fs: SkillFileSystem;
  private httpClient?: SkillHttpClient;
  private zipExtractor?: SkillZipExtractor;
  private skillCache?: SkillCache;

  /**
   * Optional embedding router for semantic skill selection.
   * When set, {@link getRoutedSkillsPromptText} uses embedding similarity
   * instead of keyword matching. Falls back to keyword routing on failure.
   */
  private embeddingRouter: EmbeddingSkillRouter | null = null;

  /**
   * Creates a new SkillManager.
   *
   * @param fs - Filesystem implementation for reading local files.
   * @param httpClient - HTTP client for fetching remote repos (optional).
   * @param zipExtractor - ZIP extractor for processing downloaded archives (optional).
   * @param cacheTtlMs - How long to cache loaded skills in milliseconds (default: 1 hour).
   */
  constructor(
    fs: SkillFileSystem,
    httpClient?: SkillHttpClient,
    zipExtractor?: SkillZipExtractor,
    cacheTtlMs: number = 60 * 60 * 1000
  ) {
    this.fs = fs;
    this.httpClient = httpClient;
    this.zipExtractor = zipExtractor;
    this.loader = new SkillLoader(fs, httpClient, zipExtractor);
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Builds a cache key from the current sources config to detect changes.
   *
   * @param config - Skills configuration containing enabled sources.
   * @returns Stable sorted key for enabled source type, URL, ref, and path values.
   */
  private buildSourcesKey(config: SkillsConfig): string {
    return JSON.stringify({
      maxSkillSizeBytes: config.maxSkillSizeBytes,
      sources: config.sources
        .filter(source => source.enabled)
        .map(source => ({
          type: source.type,
          url: source.url,
          ref: source.ref ?? '',
          path: source.path ?? '',
          sha256: source.sha256 ?? '',
        }))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    });
  }

  /** Builds the persistent cache key for one source, including integrity constraints. */
  private buildSourceCacheKey(
    source: SkillsConfig['sources'][number],
    maxSkillSizeBytes: number
  ): string {
    return JSON.stringify({
      type: source.type,
      url: source.url,
      ref: source.ref ?? '',
      path: source.path ?? '',
      sha256: source.sha256 ?? '',
      maxSkillSizeBytes,
    });
  }

  /** Attaches a cache that can be shared by separately-created managers. */
  setSkillCache(skillCache: SkillCache): void {
    this.skillCache = skillCache;
  }

  /** Reads persistent skills as a best-effort cache lookup. */
  private async getPersistedSkills(key: string): Promise<ParsedSkill[] | null> {
    try {
      return (await this.skillCache?.get(key)) ?? null;
    } catch (error) {
      console.warn(`Failed to read persistent skill cache for ${key}:`, error);
      return null;
    }
  }

  /** Writes persistent skills without affecting source loading on failure. */
  private async setPersistedSkills(key: string, skills: ParsedSkill[]): Promise<void> {
    try {
      await this.skillCache?.set(key, skills);
    } catch (error) {
      console.warn(`Failed to write persistent skill cache for ${key}:`, error);
    }
  }

  /** Deletes persistent skills without affecting explicit reload on failure. */
  private async deletePersistedSkills(key: string): Promise<void> {
    try {
      await this.skillCache?.delete?.(key);
    } catch (error) {
      console.warn(`Failed to delete persistent skill cache for ${key}:`, error);
    }
  }

  /**
   * Loads all skills from the configured sources.
   *
   * Results are cached for {@link cacheTtlMs}. The cache is automatically
   * invalidated when sources change. Call {@link invalidateCache}
   * to force a reload.
   *
   * @param config - The current skills configuration.
   * @returns Array of all loaded skills (before filtering by enabled state).
   */
  async loadAllSkills(config: SkillsConfig, forceReload = false): Promise<ParsedSkill[]> {
    const now = Date.now();
    const sourcesKey = this.buildSourcesKey(config);
    const reloadRequested = forceReload || this.reloadRequired;
    this.reloadRequired = false;

    // Invalidate cache if sources have changed
    if (sourcesKey !== this.lastSourcesKey) {
      this.cachedSkills.clear();
      this.lastSourcesKey = sourcesKey;
    }

    if (
      !reloadRequested &&
      this.cachedSkills.size > 0 &&
      now - this.lastLoadTimestamp < this.cacheTtlMs
    ) {
      return this.getAllCachedSkills();
    }

    this.cachedSkills.clear();

    // Rebuild loader only when the configured size limit changes
    if (config.maxSkillSizeBytes !== this.lastMaxSkillSizeBytes) {
      this.loader = new SkillLoader(
        this.fs,
        this.httpClient,
        this.zipExtractor,
        config.maxSkillSizeBytes
      );
      this.lastMaxSkillSizeBytes = config.maxSkillSizeBytes;
    }

    let loadFailed = false;
    for (const source of config.sources) {
      if (!source.enabled) continue;

      try {
        const sourceKey = this.buildSourceCacheKey(source, config.maxSkillSizeBytes);
        if (reloadRequested) {
          await this.deletePersistedSkills(sourceKey);
        } else {
          const cached = await this.getPersistedSkills(sourceKey);
          if (cached !== null) {
            this.cachedSkills.set(sourceKey, cached);
            continue;
          }
        }
        const skills = await this.loader.loadFromSource(source);
        this.cachedSkills.set(sourceKey, skills);
        await this.setPersistedSkills(sourceKey, skills);
      } catch (error) {
        loadFailed = true;
        console.warn(`Error loading skills from ${source.url}:`, error);
      }
    }

    this.lastLoadTimestamp = loadFailed ? 0 : now;
    return this.getAllCachedSkills();
  }

  /**
   * Loads all skills and collects per-source errors instead of swallowing them.
   *
   * Same caching behavior as {@link loadAllSkills}, but returns errors
   * alongside skills so the UI can display what went wrong.
   *
   * @param config - The current skills configuration.
   * @param onProgress - Optional callback receiving source URL and loading progress.
   * @returns Object with loaded skills and per-source errors.
   */
  async loadAllSkillsWithErrors(
    config: SkillsConfig,
    onProgress?: (sourceUrl: string, progress: import('./SkillLoader').SkillLoadProgress) => void,
    forceReload = false
  ): Promise<{
    /** Skills loaded successfully from enabled sources. */
    skills: ParsedSkill[];
    /** Per-source failures collected during this loading attempt. */
    errors: SkillLoadError[];
  }> {
    const errors: SkillLoadError[] = [];
    const now = Date.now();
    const sourcesKey = this.buildSourcesKey(config);
    const reloadRequested = forceReload || this.reloadRequired;
    this.reloadRequired = false;

    if (sourcesKey !== this.lastSourcesKey) {
      this.cachedSkills.clear();
      this.lastSourcesKey = sourcesKey;
    }

    if (
      !reloadRequested &&
      this.cachedSkills.size > 0 &&
      now - this.lastLoadTimestamp < this.cacheTtlMs
    ) {
      return { skills: this.getAllCachedSkills(), errors };
    }

    this.cachedSkills.clear();

    if (config.maxSkillSizeBytes !== this.lastMaxSkillSizeBytes) {
      this.loader = new SkillLoader(
        this.fs,
        this.httpClient,
        this.zipExtractor,
        config.maxSkillSizeBytes
      );
      this.lastMaxSkillSizeBytes = config.maxSkillSizeBytes;
    }

    for (const source of config.sources) {
      if (!source.enabled) continue;

      try {
        const sourceKey = this.buildSourceCacheKey(source, config.maxSkillSizeBytes);
        if (reloadRequested) {
          await this.deletePersistedSkills(sourceKey);
        } else {
          const cached = await this.getPersistedSkills(sourceKey);
          if (cached !== null) {
            this.cachedSkills.set(sourceKey, cached);
            continue;
          }
        }
        const skills = await this.loader.loadFromSource(
          source,
          onProgress ? p => onProgress(source.url, p) : undefined
        );
        this.cachedSkills.set(sourceKey, skills);
        await this.setPersistedSkills(sourceKey, skills);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Error loading skills from ${source.url}:`, error);
        errors.push({
          sourceUrl: source.url,
          sourceType: source.type,
          error: message,
        });
      }
    }

    this.lastLoadTimestamp = errors.length > 0 ? 0 : now;
    return { skills: this.getAllCachedSkills(), errors };
  }

  /**
   * Returns all loaded skills filtered by the user's enabled/disabled preferences.
   *
   * @param config - The current skills configuration.
   * @returns Array of enabled skills.
   */
  getEnabledSkills(config: SkillsConfig): ParsedSkill[] {
    return this.getAllCachedSkills().filter(skill => isSkillEnabled(config, skill));
  }

  /**
   * Generates the prompt injection text for all enabled skills.
   *
   * @param config - The current skills configuration.
   * @returns Formatted string ready for injection into the system prompt, or empty string.
   */
  getSkillsPromptText(config: SkillsConfig): string {
    const enabledSkills = this.getEnabledSkills(config);
    return formatSkillsForPrompt(enabledSkills, config.maxTotalSkillSizeBytes);
  }

  /**
   * Returns the total content size of all enabled skills in bytes.
   *
   * @param config - The current skills configuration.
   * @returns Total size in bytes.
   */
  getEnabledSkillsSize(config: SkillsConfig): number {
    return this.getEnabledSkills(config).reduce(
      (total, skill) => total + skill.contentSizeBytes,
      0
    );
  }

  /**
   * Returns a summary of loaded skills for display in the UI.
   *
   * @param config - The current skills configuration.
   * @returns Object with counts and size information.
   */
  getSkillsSummary(config: SkillsConfig): {
    /** Number of skills currently held in the cache. */
    totalSkills: number;
    /** Number of cached skills not disabled by configuration. */
    enabledSkills: number;
    /** Combined byte size of enabled skill content. */
    totalSizeBytes: number;
    /** Configured maximum combined skill-content size. */
    maxTotalSizeBytes: number;
  } {
    const all = this.getAllCachedSkills();
    const enabled = this.getEnabledSkills(config);
    const totalSizeBytes = enabled.reduce((sum, s) => sum + s.contentSizeBytes, 0);

    return {
      totalSkills: all.length,
      enabledSkills: enabled.length,
      totalSizeBytes,
      maxTotalSizeBytes: config.maxTotalSkillSizeBytes,
    };
  }

  /**
   * Generates prompt text for skills routed to a specific user query.
   *
   * Uses embedding-based routing when an {@link EmbeddingSkillRouter} is configured
   * and indexed, otherwise falls back to keyword-based routing via
   * {@link routeAndFormatSkills}. For small skill sets (≤ maxSkills),
   * all enabled skills are included regardless of routing strategy.
   *
   * @param query - The user's query text.
   * @param config - The current skills configuration.
   * @param routerConfig - Optional router configuration overrides.
   * @returns Formatted string with only the relevant skills, or empty string.
   */
  async getRoutedSkillsPromptText(
    query: string,
    config: SkillsConfig,
    routerConfig: SkillRouterConfig = DEFAULT_ROUTER_CONFIG
  ): Promise<string> {
    const enabledSkills = this.getEnabledSkills(config);
    if (enabledSkills.length === 0) return '';

    // For small skill sets, skip routing and include everything
    if (enabledSkills.length <= routerConfig.maxSkills) {
      return formatSkillsForPrompt(enabledSkills, config.maxTotalSkillSizeBytes);
    }

    // Try embedding-based routing first
    if (this.embeddingRouter && this.embeddingRouter.hasIndex()) {
      try {
        return await this.embeddingRouter.routeAndFormat(query, enabledSkills, routerConfig);
      } catch (error) {
        console.warn(
          'SkillManager: embedding routing failed, falling back to keyword routing:',
          error
        );
      }
    }

    // Fall back to keyword routing
    return routeAndFormatSkills(query, enabledSkills, routerConfig);
  }

  /**
   * Sets the embedding router for semantic skill selection.
   *
   * When set, {@link getRoutedSkillsPromptText} will use embedding similarity
   * to select skills. The router should be initialized with an embedding
   * provider matching the user's configured model service.
   *
   * Call this after constructing the manager and before processing queries.
   * Pass `null` to disable embedding routing and revert to keyword-only.
   *
   * @param router - An initialized embedding skill router, or null to disable.
   * @returns No value.
   */
  setEmbeddingSkillRouter(router: EmbeddingSkillRouter | null): void {
    this.embeddingRouter = router;
  }

  /**
   * Returns the current embedding router, if one is configured.
   *
   * @returns The configured embedding router, or `null` for keyword-only routing.
   */
  getEmbeddingSkillRouter(): EmbeddingSkillRouter | null {
    return this.embeddingRouter;
  }

  /**
   * Clears skill and embedding caches, forcing a reload on the next call.
   *
   * @returns No value.
   */
  invalidateCache(): void {
    this.cachedSkills.clear();
    this.lastLoadTimestamp = 0;
    this.reloadRequired = true;
    if (this.embeddingRouter) {
      this.embeddingRouter.clearIndex();
    }
  }

  /**
   * Loads skills from well-known directories relative to a project root.
   *
   * This is a convenience method that scans `.github/skills/`,
   * `.github/instructions/`, `.claude/skills/`, and `skills/` directories.
   *
   * @param projectRoot - Absolute path to the project root.
   * @returns Array of parsed skills found.
   */
  async loadFromWellKnownDirs(projectRoot: string): Promise<ParsedSkill[]> {
    const skills = await this.loader.loadFromWellKnownDirs(projectRoot);
    this.cachedSkills.set(`wellknown:${projectRoot}`, skills);
    this.lastLoadTimestamp = Date.now();
    return skills;
  }

  /**
   * Returns all cached skills as a flat array.
   *
   * @returns Skills from every cached source in map iteration order.
   */
  private getAllCachedSkills(): ParsedSkill[] {
    const all: ParsedSkill[] = [];
    for (const skills of this.cachedSkills.values()) {
      all.push(...skills);
    }
    return all;
  }
}
