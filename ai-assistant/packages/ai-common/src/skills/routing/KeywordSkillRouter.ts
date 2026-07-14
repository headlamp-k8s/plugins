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

import {
  DEFAULT_MAX_TOTAL_SKILL_SIZE_BYTES,
  formatSkillsForPrompt,
  ParsedSkill,
} from '../parseSkill';

/**
 * A scored skill with a relevance score for a given query.
 */
export interface ScoredSkill {
  /** The parsed skill. */
  skill: ParsedSkill;
  /** Relevance score (higher = more relevant, range 0–1). */
  score: number;
}

/**
 * Configuration for the skill router.
 */
export interface SkillRouterConfig {
  /** Maximum number of skills to include in the prompt. */
  maxSkills: number;
  /** Minimum relevance score (0–1) for a skill to be included. */
  minScore: number;
  /** Maximum total content size in bytes for routed skills. */
  maxTotalBytes: number;
}

/** Default router configuration. */
export const DEFAULT_ROUTER_CONFIG: SkillRouterConfig = {
  maxSkills: 5,
  minScore: 0.1,
  maxTotalBytes: DEFAULT_MAX_TOTAL_SKILL_SIZE_BYTES,
};

/**
 * Tokenizes a string into lowercase word tokens.
 *
 * Splits on whitespace and punctuation, removes stop words that add
 * noise to keyword matching, and returns unique tokens.
 *
 * @param text - The input text to tokenize.
 * @returns Array of unique lowercase tokens.
 */
export function tokenize(text: string): string[] {
  const stopWords = new Set([
    'a',
    'an',
    'the',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'shall',
    'should',
    'may',
    'might',
    'must',
    'can',
    'could',
    'of',
    'in',
    'to',
    'for',
    'with',
    'on',
    'at',
    'by',
    'from',
    'as',
    'into',
    'through',
    'and',
    'but',
    'or',
    'nor',
    'not',
    'so',
    'yet',
    'both',
    'either',
    'neither',
    'each',
    'every',
    'all',
    'any',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'only',
    'own',
    'same',
    'than',
    'too',
    'very',
    'just',
    'because',
    'about',
    'between',
    'after',
    'before',
    'during',
    'above',
    'below',
    'up',
    'down',
    'out',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'i',
    'me',
    'my',
    'we',
    'our',
    'you',
    'your',
    'he',
    'she',
    'they',
    'them',
    'their',
    'what',
    'which',
    'who',
    'whom',
    'when',
    'where',
    'why',
    'how',
    'if',
    'then',
    'else',
    'use',
    'using',
    'used',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  return [...new Set(words)];
}

/**
 * Computes a term-frequency relevance score between a query and a document.
 *
 * Uses a simple TF-based scoring: for each query token that appears in the
 * document tokens, add 1/queryLength. This normalizes the score to 0–1
 * where 1 means every query token matched.
 *
 * @param queryTokens - Tokenized user query.
 * @param docTokens - Tokenized skill description + tags + name.
 * @returns Score between 0 and 1.
 */
export function computeRelevanceScore(queryTokens: string[], docTokens: Set<string>): number {
  if (queryTokens.length === 0) return 0;

  let matches = 0;
  for (const token of queryTokens) {
    if (docTokens.has(token)) {
      matches++;
    }
    // Also check partial matches for compound terms (e.g., "ratelimit" matches "rate")
    for (const docToken of docTokens) {
      if (
        docToken !== token &&
        (docToken.includes(token) || token.includes(docToken)) &&
        docToken.length > 2
      ) {
        matches += 0.5;
        break;
      }
    }
  }

  return Math.min(1.0, matches / queryTokens.length);
}

/**
 * Routes a user query to the most relevant skills.
 *
 * Uses lightweight keyword matching on skill metadata (name, description,
 * tags) to score each skill against the user's query. Returns only the
 * top-scoring skills that fit within the configured limits.
 *
 * This avoids cramming all skills into the context window by selecting
 * only the relevant ones per query. For small skill sets (≤ maxSkills),
 * all skills are included regardless of score.
 *
 * @param query - The user's query text.
 * @param skills - All available parsed skills.
 * @param config - Router configuration (limits and thresholds).
 * @returns Array of skills selected for the query, ordered by relevance.
 */
export function routeSkills(
  query: string,
  skills: ParsedSkill[],
  config: SkillRouterConfig = DEFAULT_ROUTER_CONFIG
): ParsedSkill[] {
  // If we have fewer skills than the max, include all of them
  if (skills.length <= config.maxSkills) {
    return skills;
  }

  const queryTokens = tokenize(query);

  // If query is empty or has no meaningful tokens, return all skills up to limit
  if (queryTokens.length === 0) {
    return skills.slice(0, config.maxSkills);
  }

  // Score each skill
  const scored: ScoredSkill[] = skills.map(skill => {
    // Build the document from name + description + tags
    const docParts = [
      skill.metadata.name,
      skill.metadata.description,
      ...(skill.metadata.tags || []),
    ];
    const docTokens = new Set(tokenize(docParts.join(' ')));

    return {
      skill,
      score: computeRelevanceScore(queryTokens, docTokens),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter by min score and max count, respecting byte budget
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

/**
 * Scores all skills against a query and returns them with scores.
 *
 * Useful for debugging and UI display of skill relevance.
 *
 * @param query - The user's query text.
 * @param skills - All available parsed skills.
 * @returns Array of scored skills, sorted by relevance (descending).
 */
export function scoreSkills(query: string, skills: ParsedSkill[]): ScoredSkill[] {
  const queryTokens = tokenize(query);

  const scored: ScoredSkill[] = skills.map(skill => {
    const docParts = [
      skill.metadata.name,
      skill.metadata.description,
      ...(skill.metadata.tags || []),
    ];
    const docTokens = new Set(tokenize(docParts.join(' ')));

    return {
      skill,
      score: computeRelevanceScore(queryTokens, docTokens),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Routes skills for a query and formats them for prompt injection.
 *
 * Convenience function that combines {@link routeSkills} with
 * {@link formatSkillsForPrompt}.
 *
 * @param query - The user's query text.
 * @param skills - All available parsed skills.
 * @param config - Router configuration.
 * @returns Formatted prompt text with only the relevant skills.
 */
export function routeAndFormatSkills(
  query: string,
  skills: ParsedSkill[],
  config: SkillRouterConfig = DEFAULT_ROUTER_CONFIG
): string {
  const routed = routeSkills(query, skills, config);
  return formatSkillsForPrompt(routed, config.maxTotalBytes);
}
