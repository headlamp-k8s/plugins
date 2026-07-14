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
import {
  buildToolSearchText,
  DEFAULT_TOOL_ROUTER_CONFIG,
  routeTools,
  ScoredTool,
  ToolInfo,
  ToolRouterConfig,
} from './ToolRouter';

/**
 * An MCP tool with a pre-computed embedding vector.
 */
interface EmbeddedMCPTool {
  tool: ToolInfo;
  vector: number[];
}

/**
 * Computes the cosine similarity between two vectors.
 *
 * Returns a value in [−1, 1]. For normalized embeddings the range
 * is typically [0, 1].
 */
/**
 * Embedding-based MCP tool router using LangChain's Embeddings abstraction.
 *
 * Design mirrors {@link EmbeddingSkillRouter} for skills:
 * - Embed metadata at load time (tool name + description + schema keys).
 * - Embed the user query at request time.
 * - Fall back to keyword routing on any failure.
 */
export class EmbeddingToolRouter {
  private embeddings: EmbeddingProvider;
  private embeddedTools: EmbeddedMCPTool[] = [];
  private isIndexed: boolean = false;

  /**
   * Creates a router backed by the provided embeddings model.
   */
  constructor(embeddings: EmbeddingProvider) {
    this.embeddings = embeddings;
  }

  /**
   * Indexes MCP tools by embedding their metadata.
   *
   * Call once after tools are discovered (or rediscovered).
   */
  async indexTools(tools: ToolInfo[]): Promise<void> {
    if (tools.length === 0) {
      this.embeddedTools = [];
      this.isIndexed = true;
      return;
    }

    try {
      const texts = tools.map(buildToolSearchText);
      const vectors = await this.embeddings.embedDocuments(texts);

      this.embeddedTools = tools.map((tool, i) => ({
        tool,
        vector: vectors[i],
      }));
      this.isIndexed = true;
    } catch (error) {
      console.warn(
        'MCPEmbeddingRouter: failed to index tools, will fall back to keyword routing:',
        error
      );
      this.embeddedTools = [];
      this.isIndexed = false;
    }
  }

  /**
   * Routes a query to the most relevant MCP tools using embedding similarity.
   *
   * Falls back to keyword-based {@link routeTools} when the index is
   * unavailable or the query embedding fails.
   */
  async route(
    query: string,
    tools: ToolInfo[],
    config: ToolRouterConfig = DEFAULT_TOOL_ROUTER_CONFIG
  ): Promise<ToolInfo[]> {
    if (tools.length <= config.maxTools) {
      return tools;
    }

    if (!this.isIndexed || this.embeddedTools.length === 0) {
      return routeTools(query, tools, config);
    }

    try {
      const queryVector = await this.embeddings.embedQuery(query);
      return this.rankBySimilarity(queryVector, config);
    } catch (error) {
      console.warn(
        'MCPEmbeddingRouter: query embedding failed, falling back to keyword routing:',
        error
      );
      return routeTools(query, tools, config);
    }
  }

  /**
   * Scores all indexed tools against a query.
   *
   * Useful for debugging and UI display.
   */
  async scoreTools(query: string): Promise<ScoredTool[]> {
    if (!this.isIndexed || this.embeddedTools.length === 0) {
      return [];
    }

    try {
      const queryVector = await this.embeddings.embedQuery(query);

      const scored: ScoredTool[] = this.embeddedTools.map(({ tool, vector }) => ({
        tool,
        score: cosineSimilarity(queryVector, vector),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored;
    } catch {
      return [];
    }
  }

  /** Clears the embedding index. */
  clearIndex(): void {
    this.embeddedTools = [];
    this.isIndexed = false;
  }

  /** Returns whether the router has a valid embedding index. */
  hasIndex(): boolean {
    return this.isIndexed && this.embeddedTools.length > 0;
  }

  private rankBySimilarity(queryVector: number[], config: ToolRouterConfig): ToolInfo[] {
    const scored = this.embeddedTools.map(({ tool, vector }) => ({
      tool,
      score: cosineSimilarity(queryVector, vector),
    }));

    scored.sort((a, b) => b.score - a.score);

    const selected: ToolInfo[] = [];
    for (const { tool, score } of scored) {
      if (selected.length >= config.maxTools) break;
      if (score < config.minScore) break;
      selected.push(tool);
    }

    return selected;
  }
}
