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

import { describe, expect, it, vi } from 'vitest';
import { cosineSimilarity } from '../../embeddings/cosineSimilarity';
import type { EmbeddingProvider } from '../../embeddings/EmbeddingProvider';
import { EmbeddingToolRouter } from './EmbeddingToolRouter';
import { ToolInfo } from './ToolRouter';

/** Deterministic fake embeddings for testing. */
class FakeEmbeddings implements EmbeddingProvider {
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.hashToVector(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.hashToVector(text);
  }

  private hashToVector(text: string): number[] {
    const vec = new Array(8).fill(0);
    const lower = text.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      vec[i % 8] += lower.charCodeAt(i) / 1000;
    }
    // Normalize
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
  }
}

/** Embeddings that always throw, for fallback testing. */
class FailingEmbeddings implements EmbeddingProvider {
  async embedDocuments(): Promise<number[][]> {
    throw new Error('embedding service unavailable');
  }
  async embedQuery(): Promise<number[]> {
    throw new Error('embedding service unavailable');
  }
}

function makeTool(name: string, description: string, serverName: string = 'test-server'): ToolInfo {
  return { name, description, serverName };
}

describe('MCPEmbeddingRouter', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0, 5);
    });

    it('returns 0 for orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
    });

    it('returns 0 for empty vectors', () => {
      expect(cosineSimilarity([], [])).toBe(0);
    });

    it('returns 0 for mismatched lengths', () => {
      expect(cosineSimilarity([1], [1, 2])).toBe(0);
    });
  });

  describe('indexTools', () => {
    it('indexes tools successfully', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      const tools = [makeTool('s__t1', 'list pods', 's')];
      await router.indexTools(tools);
      expect(router.hasIndex()).toBe(true);
    });

    it('handles empty tool list', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      await router.indexTools([]);
      expect(router.hasIndex()).toBe(false);
    });

    it('falls back gracefully on embedding failure', async () => {
      const router = new EmbeddingToolRouter(new FailingEmbeddings());
      await router.indexTools([makeTool('s__t', 'desc', 's')]);
      expect(router.hasIndex()).toBe(false);
    });
  });

  describe('route', () => {
    const tools: ToolInfo[] = [
      makeTool('kubectl__get_pods', 'List pods in Kubernetes', 'kubectl'),
      makeTool('helm__install', 'Install Helm chart', 'helm'),
      makeTool('docker__build', 'Build Docker image', 'docker'),
    ];

    it('returns all tools when count <= maxTools', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      await router.indexTools(tools);
      const result = await router.route('anything', tools, { maxTools: 10, minScore: 0.1 });
      expect(result).toHaveLength(3);
    });

    it('selects relevant tools when indexed', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      await router.indexTools(tools);
      const result = await router.route('list pods', tools, { maxTools: 1, minScore: 0.0 });
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back to keyword routing when not indexed', async () => {
      const router = new EmbeddingToolRouter(new FailingEmbeddings());
      await router.indexTools(tools);
      // Not indexed due to failure, should fall back to keyword routing
      const result = await router.route('list pods', tools, { maxTools: 1, minScore: 0.0 });
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back when query embedding fails', async () => {
      const embeddings = new FakeEmbeddings();
      const router = new EmbeddingToolRouter(embeddings);
      await router.indexTools(tools);
      // Sabotage embedQuery after indexing
      vi.spyOn(embeddings, 'embedQuery').mockRejectedValueOnce(new Error('fail'));
      const result = await router.route('list pods', tools, { maxTools: 1, minScore: 0.0 });
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('scoreTools', () => {
    it('returns scored tools', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      const tools = [
        makeTool('s__list_pods', 'List Kubernetes pods', 's'),
        makeTool('s__build_image', 'Build Docker image', 's'),
      ];
      await router.indexTools(tools);
      const scored = await router.scoreTools('list pods');
      expect(scored).toHaveLength(2);
      expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    });

    it('returns empty array when not indexed', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      const scored = await router.scoreTools('anything');
      expect(scored).toHaveLength(0);
    });
  });

  describe('clearIndex', () => {
    it('clears the index', async () => {
      const router = new EmbeddingToolRouter(new FakeEmbeddings());
      await router.indexTools([makeTool('s__t', 'desc', 's')]);
      expect(router.hasIndex()).toBe(true);
      router.clearIndex();
      expect(router.hasIndex()).toBe(false);
    });
  });
});
