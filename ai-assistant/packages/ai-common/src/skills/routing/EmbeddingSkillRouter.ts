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

import { cosineSimilarity } from '../../embeddings/cosineSimilarity';
import type { EmbeddingProvider } from '../../embeddings/EmbeddingProvider';
import { formatSkillsForPrompt, ParsedSkill } from '../parseSkill';
import {
  DEFAULT_ROUTER_CONFIG,
  routeSkills,
  ScoredSkill,
  SkillRouterConfig,
} from './KeywordSkillRouter';

/**
 * A skill with a pre-computed embedding vector for similarity search.
 */
interface EmbeddedSkill {
  /** The parsed skill. */
  skill: ParsedSkill;
  /** The embedding vector computed from skill metadata. */
  vector: number[];
}

/**
 * Builds the text representation of a skill used for embedding.
 *
 * Follows the best practice of embedding metadata only (name + description + tags),
 * not the full content body. This keeps embeddings focused on the routing signal
 * and avoids noise from multi-KB skill bodies.
 *
 * @param skill - The parsed skill to build text for.
 * @returns A concatenated string of the skill's routing-relevant metadata.
 */
export function buildSkillEmbeddingText(skill: ParsedSkill): string {
  const parts = [skill.metadata.name, skill.metadata.description];
  if (skill.metadata.tags && skill.metadata.tags.length > 0) {
    parts.push(skill.metadata.tags.join(' '));
  }
  return parts.join(' ');
}

/**
 * Embedding-based skill router using the shared embedding-provider abstraction.
 *
 * Follows best practices from the skills proposal and LangChain documentation:
 *
 * - **Embed descriptions, not full content.** The description is the routing
 *   signal. Embedding 20 KB of Markdown adds noise.
 * - **Embed at load time, query at runtime.** Skill descriptions change rarely
 *   (hourly cache TTL). We embed once when skills are loaded and only embed
 *   the query at runtime.
 * - **Use the same provider the user configured.** The caller passes in the
 *   appropriate embedding provider for the active model service.
 * - **Keep keyword routing as fallback.** If embedding fails (model unavailable,
 *   rate-limited, network error), we fall back to keyword-based {@link routeSkills}.
 *
 * @see https://js.langchain.com/docs/how_to/custom_tools/
 * @see https://python.langchain.com/docs/modules/agents/tools/dynamic_selection/
 */
export class EmbeddingSkillRouter {
  private embeddings: EmbeddingProvider;
  private embeddedSkills: EmbeddedSkill[] = [];
  private isIndexed: boolean = false;

  /**
   * Creates an EmbeddingSkillRouter.
   *
   * @param embeddings - Embedding provider configured for the active model service.
   */
  constructor(embeddings: EmbeddingProvider) {
    this.embeddings = embeddings;
  }

  /**
   * Indexes skills by computing embedding vectors for their metadata.
   *
   * Should be called once after skills are loaded (or reloaded). The index
   * is stored in memory and reused for all subsequent queries until
   * {@link clearIndex} is called.
   *
   * @param skills - The parsed skills to index.
   * @returns A promise that resolves after indexing succeeds or fallback state is set.
   * @throws Logs a warning and sets the index as failed if embedding fails.
   */
  async indexSkills(skills: ParsedSkill[]): Promise<void> {
    if (skills.length === 0) {
      this.embeddedSkills = [];
      this.isIndexed = true;
      return;
    }

    try {
      const texts = skills.map(buildSkillEmbeddingText);
      const vectors = await this.embeddings.embedDocuments(texts);

      this.embeddedSkills = skills.map((skill, i) => ({
        skill,
        vector: vectors[i],
      }));
      this.isIndexed = true;
    } catch (error) {
      console.warn(
        'EmbeddingSkillRouter: failed to index skills, will fall back to keyword routing:',
        error
      );
      this.embeddedSkills = [];
      this.isIndexed = false;
    }
  }

  /**
   * Routes a user query to the most relevant skills using embedding similarity.
   *
   * If the embedding index is not available (not indexed or indexing failed),
   * falls back to keyword-based routing via {@link routeSkills}.
   *
   * @param query - The user's query text.
   * @param skills - All available parsed skills (used for fallback).
   * @param config - Router configuration (limits and thresholds).
   * @returns Array of skills selected for the query, ordered by relevance.
   */
  async route(
    query: string,
    skills: ParsedSkill[],
    config: SkillRouterConfig = DEFAULT_ROUTER_CONFIG
  ): Promise<ParsedSkill[]> {
    // For small skill sets, include all (same as keyword router)
    if (skills.length <= config.maxSkills) {
      return skills;
    }

    // Fall back to keyword routing if not indexed
    if (!this.isIndexed || this.embeddedSkills.length === 0) {
      return routeSkills(query, skills, config);
    }

    try {
      const queryVector = await this.embeddings.embedQuery(query);
      return this.rankBySimilarity(queryVector, config);
    } catch (error) {
      console.warn(
        'EmbeddingSkillRouter: query embedding failed, falling back to keyword routing:',
        error
      );
      return routeSkills(query, skills, config);
    }
  }

  /**
   * Scores all indexed skills against a query and returns them with scores.
   *
   * Useful for debugging and UI display of skill relevance.
   * Falls back to empty array if not indexed.
   *
   * @param query - The user's query text.
   * @returns Array of scored skills, sorted by relevance (descending).
   */
  async scoreSkills(query: string): Promise<ScoredSkill[]> {
    if (!this.isIndexed || this.embeddedSkills.length === 0) {
      return [];
    }

    try {
      const queryVector = await this.embeddings.embedQuery(query);

      const scored: ScoredSkill[] = this.embeddedSkills.map(({ skill, vector }) => ({
        skill,
        score: cosineSimilarity(queryVector, vector),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored;
    } catch {
      return [];
    }
  }

  /**
   * Routes skills and formats them for prompt injection.
   *
   * Convenience method that combines {@link route} with
   * {@link formatSkillsForPrompt}.
   *
   * @param query - The user's query text.
   * @param skills - All available parsed skills.
   * @param config - Router configuration.
   * @returns Formatted prompt text with only the relevant skills.
   */
  async routeAndFormat(
    query: string,
    skills: ParsedSkill[],
    config: SkillRouterConfig = DEFAULT_ROUTER_CONFIG
  ): Promise<string> {
    const routed = await this.route(query, skills, config);
    return formatSkillsForPrompt(routed, config.maxTotalBytes);
  }

  /**
   * Clears the embedding index, forcing re-indexing on next use.
   *
   * @returns No value.
   */
  clearIndex(): void {
    this.embeddedSkills = [];
    this.isIndexed = false;
  }

  /**
   * Returns whether the router has a valid non-empty embedding index.
   *
   * @returns Whether indexing succeeded and produced at least one entry.
   */
  hasIndex(): boolean {
    return this.isIndexed && this.embeddedSkills.length > 0;
  }

  /**
   * Ranks embedded skills by cosine similarity to a query vector.
   *
   * Respects both count (`maxSkills`) and size (`maxTotalBytes`) budgets,
   * using a minimum score threshold based on cosine similarity.
   * Cosine similarity scores are typically in [0, 1] for normalized
   * embeddings, so we use `minScore` directly as the threshold.
   *
   * @param queryVector - Embedded user query to compare with indexed skills.
   * @param config - Count, byte-budget, and minimum-score limits.
   * @returns Relevant skills ordered by similarity within configured budgets.
   */
  private rankBySimilarity(queryVector: number[], config: SkillRouterConfig): ParsedSkill[] {
    const scored = this.embeddedSkills.map(({ skill, vector }) => ({
      skill,
      score: cosineSimilarity(queryVector, vector),
    }));

    scored.sort((a, b) => b.score - a.score);

    const selected: ParsedSkill[] = [];
    let totalBytes = 0;

    for (const { skill, score } of scored) {
      if (selected.length >= config.maxSkills) break;
      if (score < config.minScore) break;
      if (totalBytes + skill.contentSizeBytes > config.maxTotalBytes) continue;

      selected.push(skill);
      totalBytes += skill.contentSizeBytes;
    }

    return selected;
  }
}
