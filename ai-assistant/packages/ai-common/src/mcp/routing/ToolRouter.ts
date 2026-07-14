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

/**
 * Describes an MCP tool for routing purposes.
 */
export interface ToolInfo {
  /** Full tool name, typically `serverName__toolName`. */
  name: string;
  /** Human-readable description from the MCP server. */
  description: string;
  /** Server that provides this tool. */
  serverName: string;
  /** JSON Schema for tool input arguments. */
  inputSchema?: Record<string, unknown>;
}

/**
 * An MCP tool scored against a user query.
 */
export interface ScoredTool {
  /** The tool info. */
  tool: ToolInfo;
  /** Relevance score (0–1, higher = more relevant). */
  score: number;
}

/**
 * Configuration for the MCP tool router.
 */
export interface ToolRouterConfig {
  /** Maximum number of tools to select per query. */
  maxTools: number;
  /** Minimum relevance score (0–1) for a tool to be included. */
  minScore: number;
}

/** Default router configuration. */
export const DEFAULT_TOOL_ROUTER_CONFIG: ToolRouterConfig = {
  maxTools: 10,
  minScore: 0.1,
};

// Re-use the same stop-word list as SkillRouter for consistency.
const STOP_WORDS = new Set([
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

/**
 * Tokenizes text into unique lowercase word tokens, removing stop words.
 *
 * @param text - Text to normalize and tokenize.
 * @returns Unique lowercase tokens with stop words and one-character terms removed.
 */
export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  return [...new Set(words)];
}

/**
 * Computes a TF-based relevance score between query tokens and document tokens.
 *
 * For each query token that appears in the document, adds `1/queryLength`.
 * Partial matches (substring containment) contribute `0.5/queryLength`.
 * The result is clamped to [0, 1].
 *
 * @param queryTokens - Normalized tokens from the user query.
 * @param docTokens - Normalized searchable tokens for one tool.
 * @returns A relevance score from `0` to `1`.
 */
export function computeRelevanceScore(queryTokens: string[], docTokens: Set<string>): number {
  if (queryTokens.length === 0) return 0;

  let matches = 0;
  for (const token of queryTokens) {
    if (docTokens.has(token)) {
      matches++;
    } else {
      // Only check partial matches when there is no exact match
      for (const docToken of docTokens) {
        if ((docToken.includes(token) || token.includes(docToken)) && docToken.length > 2) {
          matches += 0.5;
          break;
        }
      }
    }
  }

  return Math.min(1.0, matches / queryTokens.length);
}

/**
 * Builds a searchable text from an MCP tool's metadata.
 *
 * Combines the tool name (splitting on `__` and `_`), server name,
 * description, and schema property names into a single string for
 * keyword matching.
 *
 * @param tool - MCP tool metadata to make searchable.
 * @returns Combined searchable text for keyword tokenization.
 */
export function buildToolSearchText(tool: ToolInfo): string {
  const parts: string[] = [];

  // Split tool name on separators for keyword matching
  parts.push(tool.name.replace(/__/g, ' ').replace(/_/g, ' '));
  parts.push(tool.serverName.replace(/_/g, ' '));
  parts.push(tool.description);

  // Include schema property names as additional keywords
  if (tool.inputSchema && typeof tool.inputSchema === 'object') {
    const schema = tool.inputSchema as Record<string, unknown>;
    const properties = schema.properties;
    if (properties && typeof properties === 'object') {
      parts.push(Object.keys(properties as Record<string, unknown>).join(' '));
    }
  }

  return parts.join(' ');
}

/**
 * Routes a user query to the most relevant MCP tools using keyword matching.
 *
 * When fewer tools are available than `maxTools`, all are returned. Otherwise,
 * tools are scored by keyword overlap and filtered by `minScore`.
 *
 * @param query - The user's query text.
 * @param tools - All available MCP tools.
 * @param config - Router configuration.
 * @returns Array of tools selected for the query, ordered by relevance.
 */
export function routeTools(
  query: string,
  tools: ToolInfo[],
  config: ToolRouterConfig = DEFAULT_TOOL_ROUTER_CONFIG
): ToolInfo[] {
  if (tools.length <= config.maxTools) {
    return tools;
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return tools.slice(0, config.maxTools);
  }

  const scored: ScoredTool[] = tools.map(tool => {
    const docTokens = new Set(tokenize(buildToolSearchText(tool)));
    return {
      tool,
      score: computeRelevanceScore(queryTokens, docTokens),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected: ToolInfo[] = [];
  for (const { tool, score } of scored) {
    if (selected.length >= config.maxTools) break;
    if (score < config.minScore) break;
    selected.push(tool);
  }

  return selected;
}

/**
 * Scores all MCP tools against a query and returns them sorted by relevance.
 *
 * Useful for debugging and UI display.
 *
 * @param query - User query to score against each tool.
 * @param tools - MCP tools to score without filtering.
 * @returns All tools with relevance scores sorted from highest to lowest.
 */
export function scoreTools(query: string, tools: ToolInfo[]): ScoredTool[] {
  const queryTokens = tokenize(query);

  const scored: ScoredTool[] = tools.map(tool => {
    const docTokens = new Set(tokenize(buildToolSearchText(tool)));
    return {
      tool,
      score: computeRelevanceScore(queryTokens, docTokens),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
