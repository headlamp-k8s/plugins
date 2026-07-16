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

import { beforeEach, describe, expect, it } from 'vitest';
import { cosineSimilarity } from '../../embeddings/cosineSimilarity';
import type { EmbeddingProvider } from '../../embeddings/EmbeddingProvider';
import { ParsedSkill } from '../parseSkill';
import { buildSkillEmbeddingText, EmbeddingSkillRouter } from './EmbeddingSkillRouter';
import { DEFAULT_ROUTER_CONFIG, SkillRouterConfig } from './KeywordSkillRouter';

const encoder = new TextEncoder();

/** Helper to create a minimal ParsedSkill for testing. */
function makeSkill(
  name: string,
  description: string,
  content: string = `Content for ${name}`,
  tags?: string[]
): ParsedSkill {
  return {
    metadata: { name, description, ...(tags ? { tags } : {}) },
    content,
    contentSizeBytes: encoder.encode(content).length,
    source: `test/${name}/SKILL.md`,
  };
}

/**
 * Creates a mock Embeddings implementation for deterministic testing.
 *
 * Uses a simple bag-of-words approach: each unique word across all
 * embedded texts gets a dimension. The vector for a text has 1.0
 * for each word present and 0.0 for absent words. This gives
 * predictable cosine similarity scores based on word overlap.
 *
 * The two-pass approach (rawVectors then padVector) is necessary because
 * vocabulary grows as new words are seen during embedDocuments(). After
 * the first pass builds the final vocabulary, the second pass pads all
 * vectors to the same length so cosine similarity works correctly.
 */
function createMockEmbeddings(opts?: {
  failOnQuery?: boolean;
  failOnDocuments?: boolean;
}): EmbeddingProvider & { vocabulary: string[] } {
  const vocabulary: string[] = [];

  function textToVector(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);

    // Add new words to vocabulary
    for (const word of words) {
      if (!vocabulary.includes(word)) {
        vocabulary.push(word);
      }
    }

    // Build vector from current vocabulary
    return vocabulary.map(v => (words.includes(v) ? 1.0 : 0.0));
  }

  function padVector(v: number[]): number[] {
    // Pad all vectors to vocabulary length
    while (v.length < vocabulary.length) {
      v.push(0.0);
    }
    return v;
  }

  const embeddings = {
    vocabulary,
    embedDocuments: async (texts: string[]) => {
      if (opts?.failOnDocuments) {
        throw new Error('Mock embedDocuments failure');
      }
      // First pass: build vocabulary from all texts
      const rawVectors = texts.map(textToVector);
      // Second pass: pad all vectors to final vocabulary size
      return rawVectors.map(padVector);
    },
    embedQuery: async (text: string) => {
      if (opts?.failOnQuery) {
        throw new Error('Mock embedQuery failure');
      }
      const v = textToVector(text);
      return padVector(v);
    },
  } satisfies EmbeddingProvider & { vocabulary: string[] };

  return embeddings;
}

// ──────────────────────────────────────────────────────────────────────
// cosineSimilarity
// ──────────────────────────────────────────────────────────────────────
describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
  });

  it('returns correct similarity for partial overlap', () => {
    const sim = cosineSimilarity([1, 1, 0], [1, 0, 0]);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it('returns 0 for empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('returns 0 for mismatched lengths', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it('returns 0 for zero vectors', () => {
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('handles negative values', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });
});

// ──────────────────────────────────────────────────────────────────────
// buildSkillEmbeddingText
// ──────────────────────────────────────────────────────────────────────
describe('buildSkillEmbeddingText', () => {
  it('combines name and description', () => {
    const skill = makeSkill('my-skill', 'Does something useful');
    const text = buildSkillEmbeddingText(skill);
    expect(text).toBe('my-skill Does something useful');
  });

  it('includes tags when present', () => {
    const skill = makeSkill('my-skill', 'Does something', 'content', ['kubernetes', 'pod']);
    const text = buildSkillEmbeddingText(skill);
    expect(text).toBe('my-skill Does something kubernetes pod');
  });

  it('excludes tags when empty', () => {
    const skill = makeSkill('my-skill', 'Does something', 'content', []);
    const text = buildSkillEmbeddingText(skill);
    expect(text).toBe('my-skill Does something');
  });
});

// ──────────────────────────────────────────────────────────────────────
// EmbeddingSkillRouter
// ──────────────────────────────────────────────────────────────────────
describe('EmbeddingSkillRouter', () => {
  const skills: ParsedSkill[] = [
    makeSkill('install', 'Kubeshark installation and deployment', 'Helm install content', [
      'kubeshark',
      'helm',
      'install',
    ]),
    makeSkill('network-rca', 'Kubernetes network root cause analysis', 'Snapshot and KFL content', [
      'kubernetes',
      'network',
      'rca',
    ]),
    makeSkill('helmfile', 'Helmfile declarative Helm chart deployment', 'Helmfile content', [
      'helm',
      'helmfile',
      'deployment',
    ]),
    makeSkill('node-not-ready', 'Troubleshoot NotReady node status', 'Node troubleshooting', [
      'kubernetes',
      'node',
      'troubleshooting',
    ]),
    makeSkill('pod-failure', 'Troubleshoot CrashLoopBackOff OOMKilled', 'Pod troubleshooting', [
      'kubernetes',
      'pod',
      'crashloop',
    ]),
    makeSkill('security', 'Kubernetes RBAC security analysis', 'K8s security', [
      'kubernetes',
      'security',
      'rbac',
    ]),
  ];

  let router: EmbeddingSkillRouter;
  let mockEmbeddings: EmbeddingProvider;

  beforeEach(() => {
    mockEmbeddings = createMockEmbeddings();
    router = new EmbeddingSkillRouter(mockEmbeddings);
  });

  describe('indexSkills', () => {
    it('indexes skills successfully', async () => {
      await router.indexSkills(skills);
      expect(router.hasIndex()).toBe(true);
    });

    it('handles empty skill list', async () => {
      await router.indexSkills([]);
      expect(router.hasIndex()).toBe(false);
    });

    it('handles embedding failure gracefully', async () => {
      const failingEmbeddings = createMockEmbeddings({ failOnDocuments: true });
      const failRouter = new EmbeddingSkillRouter(failingEmbeddings);

      await failRouter.indexSkills(skills);
      expect(failRouter.hasIndex()).toBe(false);
    });
  });

  describe('clearIndex', () => {
    it('clears the index', async () => {
      await router.indexSkills(skills);
      expect(router.hasIndex()).toBe(true);

      router.clearIndex();
      expect(router.hasIndex()).toBe(false);
    });
  });

  describe('route', () => {
    it('returns all skills when count is below maxSkills', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 10 };
      const result = await router.route('anything', skills, config);
      expect(result).toHaveLength(6);
    });

    it('selects relevant skills for install query', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.01 };
      const result = await router.route('install kubeshark helm', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('install');
    });

    it('selects relevant skills for network query', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.01 };
      const result = await router.route('kubernetes network analysis rca', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('network-rca');
    });

    it('selects relevant skills for security query', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.01 };
      const result = await router.route('kubernetes rbac security', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('security');
    });

    it('respects maxSkills limit', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.01 };
      const result = await router.route('kubernetes', skills, config);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('respects byte budget', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 5, maxTotalBytes: 50, minScore: 0.01 };
      const result = await router.route('kubernetes', skills, config);
      const totalBytes = result.reduce((sum, s) => sum + s.contentSizeBytes, 0);
      expect(totalBytes).toBeLessThanOrEqual(50);
    });

    it('falls back to keyword routing when not indexed', async () => {
      // Don't index — router should fall back to keyword routing
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = await router.route('install kubeshark', skills, config);
      // Should still return results from keyword fallback
      expect(result.length).toBeGreaterThan(0);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('install');
    });

    it('falls back to keyword routing when query embedding fails', async () => {
      const failingEmbeddings = createMockEmbeddings({ failOnQuery: true });
      const failRouter = new EmbeddingSkillRouter(failingEmbeddings);

      // Index succeeds, but query will fail
      await failRouter.indexSkills(skills);

      // Need > maxSkills to trigger actual routing
      const config: SkillRouterConfig = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = await failRouter.route('install kubeshark', skills, config);
      // Should fall back to keyword routing
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('scoreSkills', () => {
    it('returns all skills with scores', async () => {
      await router.indexSkills(skills);
      const scored = await router.scoreSkills('install kubeshark');
      expect(scored).toHaveLength(6);
      expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    });

    it('returns empty array when not indexed', async () => {
      const scored = await router.scoreSkills('install');
      expect(scored).toHaveLength(0);
    });

    it('ranks most relevant skill first', async () => {
      await router.indexSkills(skills);
      const scored = await router.scoreSkills('install kubeshark helm');
      expect(scored[0].skill.metadata.name).toBe('install');
    });
  });

  describe('routeAndFormat', () => {
    it('formats only relevant skills', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.01 };
      const prompt = await router.routeAndFormat('install kubeshark', skills, config);
      expect(prompt).toContain('SKILLS:');
      expect(prompt).toContain('<skill name="install"');
    });

    it('returns empty string when no skills match', async () => {
      await router.indexSkills(skills);
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.99 };
      const prompt = await router.routeAndFormat('completely unrelated xyz', skills, config);
      expect(prompt).toBe('');
    });
  });
});
