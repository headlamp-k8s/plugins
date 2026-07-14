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

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { ConversationMessage as Prompt } from '../../conversation/types';

/**
 * Extracts text from the content variants returned by chat providers.
 *
 * @param content - String, text-block array, nested content object, or scalar value.
 * @returns Concatenated provider text, or an empty string when extraction fails.
 */
function extractResponseText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (
          item
        ): item is {
          /** Provider content-block discriminator. */
          type: 'text';
          /** Optional provider text payload. */
          text?: unknown;
        } => typeof item === 'object' && item !== null && 'type' in item && item.type === 'text'
      )
      .map(item => (typeof item.text === 'string' ? item.text : ''))
      .join('');
  }
  if (typeof content === 'object' && content !== null) {
    if ('text' in content && typeof content.text === 'string') return content.text;
    if ('content' in content) return extractResponseText(content.content);
  }
  try {
    return String(content || '');
  } catch {
    return '';
  }
}

/**
 * Returns the first balanced JSON object in free-form model text.
 *
 * @param text - Model text that may contain a JSON object.
 * @returns The first balanced object substring, or `null` when none exists.
 */
function extractFirstJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === '{') {
      if (depth === 0) start = index;
      depth++;
    } else if (character === '}' && depth > 0) {
      depth--;
      if (depth === 0 && start >= 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

/**
 * ToolOrchestrator - Analyzes user requests and determines all relevant tools
 * that should be executed together to provide a comprehensive response.
 *
 * This enables multi-tool execution in a single interaction rather than
 * requiring users to make multiple requests.
 *
 * Works with ANY type of tools:
 * - MCP (Model Context Protocol) tools
 * - Kubernetes tools
 * - GitHub/GitOps tools
 * - Cloud provider tools
 * - Custom business tools
 * - Any tool that can be executed and returns results
 */

/** A tool recommendation produced for a single execution step. */
export interface RecommendedTool {
  /** Exact tool name to execute. */
  name: string;
  /** Human-readable summary of what the tool does. */
  description: string;
  /** Arguments to pass to the tool. */
  arguments: Record<string, unknown>;
  /** Relative execution priority for the tool. */
  priority: 'high' | 'medium' | 'low';
  /** Explanation of why this tool was selected. */
  reason: string;
}

/** The full tool orchestration recommendation for a user request. */
export interface ToolRecommendation {
  /** Tools that should be executed to answer the request. */
  tools: RecommendedTool[];
  /** Summary of the orchestration reasoning. */
  analysis: string;
  /** Whether the recommended tools should run together as one plan. */
  shouldExecuteAll: boolean;
}

const ToolRecommendationSchema = z.object({
  analysis: z.string().describe('Analysis of what information the user needs'),
  tools: z
    .array(
      z
        .object({
          name: z.string().optional().describe('Exact name of the tool to execute'),
          tool_name: z.string().optional().describe('Alternative field for tool name'),
          description: z.string().describe('What this tool will do'),
          arguments: z
            .union([
              z.record(z.string(), z.any()),
              z.string().transform(v => {
                try {
                  const parsed = JSON.parse(v);
                  // Only accept the result if it is actually an object (not a
                  // primitive that JSON.parse succeeds on, e.g. `"null"` → null)
                  return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
                    ? (parsed as Record<string, unknown>)
                    : {};
                } catch {
                  // Unparseable string — fall back to empty args so downstream
                  // code (which expects an object) never receives a string.
                  return {} as Record<string, unknown>;
                }
              }),
            ])
            .default({})
            .describe('Arguments needed for this tool'),
          priority: z
            .enum(['high', 'medium', 'low'])
            .default('medium')
            .describe('Execution priority - high priority tools run first'),
          reason: z.string().describe('Why this tool is needed to answer the user question'),
        })
        .transform(tool => ({
          ...tool,
          name: tool.name || tool.tool_name || '',
          arguments: tool.arguments,
        }))
    )
    .describe('List of tools to execute'),
  shouldExecuteAll: z
    .boolean()
    .default(true)
    .describe('Whether all tools should be executed together for a complete answer'),
});

/** Analyzes user requests and recommends tool execution plans. */
export class ToolPlanner {
  /**
   * Analyzes a user request and determines all relevant tools to execute together
   * @param userMessage The user's question/request
   * @param availableTools List of available tool names and descriptions (from any domain)
   * @param model The language model to use for analysis
   * @param conversationHistory Previous messages for context
   * @param signal Optional AbortSignal for cancellation
   * @returns Recommended tools with arguments, analysis, and execution strategy
   *
   * This method is domain-agnostic and works with:
   * - Infrastructure/Kubernetes tools
   * - GitOps/GitHub tools
   * - MCP (Model Context Protocol) tools
   * - Database tools
   * - API tools
   * - Any other tools that return results
   */
  static async analyzeAndRecommendTools(
    userMessage: string,
    availableTools: Array<{
      /** Exact tool identifier available for recommendation. */
      name: string;
      /** Human-readable behavior supplied to the planning model. */
      description: string;
    }>,
    model: BaseChatModel,
    conversationHistory: Prompt[] = [],
    signal?: AbortSignal
  ): Promise<ToolRecommendation> {
    const toolsList = availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');

    const systemPrompt = `You are an intelligent tool orchestrator that analyzes user requests and recommends the best combination of tools to execute together.
Your task is to determine ALL relevant tools that should be executed to provide a comprehensive answer to the user's request.

IMPORTANT RULES:
1. Recommend MULTIPLE tools when they provide complementary information to answer the user's question completely
2. Order tools by execution priority (high priority first)
3. Provide specific, concrete arguments for each tool based on the user's request and context
4. Tools that read/fetch data can execute in parallel for better performance
5. Tools that modify state should execute sequentially to maintain consistency
6. Always think about what information the user really needs to answer their question completely
7. Consider dependencies: if one tool's output is needed for another tool's input, put dependent tool last
8. Be inclusive: recommend all tools that could be helpful, not just the minimum needed

TOOL CATEGORIES:
- READ tools: get_*, list_*, search_*, read, fetch, describe, show, display
- WRITE tools: create, apply, update, patch, delete, remove, modify, reconcile, merge
- QUERY tools: search, query, find, lookup, retrieve

Available tools:
${toolsList}

GENERIC EXAMPLES OF MULTI-TOOL SCENARIOS:

Example 1: Information Gathering
- User: "Give me a complete picture of the system"
- Recommended tools: All read/query tools that provide different perspectives
- Pattern: Execute all reads in parallel, synthesize results

Example 2: Creation + Verification
- User: "Create something and verify it worked"
- Recommended tools: Write tool first, then read tools to verify
- Pattern: Sequential write, then parallel reads

Example 3: Query + Related Data
- User: "Show me status, metrics, and logs"
- Recommended tools: get_status, get_metrics, get_logs
- Pattern: All parallel (all read operations)

Example 4: Multi-source Data
- User: "Compare configurations from multiple sources"
- Recommended tools: get_file_contents, list_resources, query_database
- Pattern: Parallel execution of different data sources

Example 5: Workflow Orchestration
- User: "Deploy this and handle any failures"
- Recommended tools: apply_manifest, trigger_reconciliation, get_status, get_logs
- Pattern: Apply (sequential), then reconcile (sequential), then verify (parallel)

DECISION LOGIC:
- Can tools run in parallel? If yes, and both help answer the question, recommend both
- Are there dependencies? If tool B needs output from tool A, note this in priority
- Does the user need complete information? If yes, recommend complementary tools
- Are there failure cases? Include tools that help diagnose problems

RESPONSE FORMAT:
Return a JSON object with EXACTLY this structure:
{
  "analysis": "Your explanation of what the user needs",
  "tools": [
    {
      "name": "exact_tool_name",
      "description": "What this tool does",
      "arguments": { "key": "value" },
      "priority": "high|medium|low",
      "reason": "Why this tool is needed"
    }
  ],
  "shouldExecuteAll": true
}

IMPORTANT: Use "name" (not "tool_name") for the tool field. Each tool object must have: name, description, arguments (as object), priority, and reason.`;

    const userPrompt = `User request: "${userMessage}"

Analyze this request and recommend ALL tools needed to answer it completely.
For each tool, provide:
1. Exact tool name (must match available tools) - use the "name" field
2. Complete arguments needed as a JSON object
3. Why it's needed

Return your response as a valid JSON object. Include ONLY the JSON, no other text.`;

    try {
      // Build messages with conversation history if available
      const messages = [
        new SystemMessage(systemPrompt),
        ...conversationHistory
          .filter(msg => msg.role === 'system' || msg.role === 'assistant' || msg.role === 'user')
          .map(msg => {
            if (msg.role === 'system') return new SystemMessage(msg.content ?? '');
            if (msg.role === 'assistant') return new AIMessage(msg.content ?? '');
            return new HumanMessage(msg.content ?? '');
          }),
        new HumanMessage(userPrompt),
      ];

      // Call the model to get tool recommendations
      const response = await model.invoke(messages, { signal });

      // Extract and parse the response
      const responseText = this.extractTextContent(response.content);

      // Try to extract JSON from the response - handle nested braces
      let parsedResponse;
      const jsonObject = extractFirstJsonObject(responseText);
      if (!jsonObject) {
        console.warn('Could not extract JSON from tool orchestrator response:', responseText);
        return {
          tools: [],
          analysis: responseText,
          shouldExecuteAll: false,
        };
      }

      try {
        parsedResponse = JSON.parse(jsonObject);
      } catch (parseError) {
        console.warn('Failed to parse JSON from response:', jsonObject, parseError);
        return {
          tools: [],
          analysis: responseText,
          shouldExecuteAll: false,
        };
      }

      // Validate the response against schema with better error handling
      let validated;
      try {
        validated = ToolRecommendationSchema.parse(parsedResponse);
      } catch (validationError) {
        // Try to extract what we can from the response
        const fallbackAnalysis = parsedResponse.analysis || responseText;

        return {
          tools: [],
          analysis: fallbackAnalysis,
          shouldExecuteAll: false,
        };
      }

      // Filter tools to ensure they exist in availableTools
      const validatedTools = validated.tools.filter(tool =>
        availableTools.some(available => available.name === tool.name)
      );

      return {
        tools: validatedTools,
        analysis: validated.analysis,
        shouldExecuteAll: validated.shouldExecuteAll && validatedTools.length > 0,
      };
    } catch (error) {
      console.error('Error in tool orchestration analysis:', error);
      // Return empty recommendations on error - fall back to single tool
      return {
        tools: [],
        analysis: 'Unable to analyze tool requirements',
        shouldExecuteAll: false,
      };
    }
  }

  /**
   * Groups tools by execution strategy and priority.
   *
   * @param tools - Recommended tools to classify by verb and HTTP method.
   * @returns Parallel read-like tools and sequential write-like tools.
   */
  static groupToolsByExecutionStrategy(tools: RecommendedTool[]): {
    /** Read-like tools sorted from high to low priority. */
    parallel: RecommendedTool[];
    /** Write-like tools sorted from high to low priority. */
    sequential: RecommendedTool[];
  } {
    // Read-only tools can execute in parallel
    // Modification tools should execute sequentially
    const readPatterns = ['get', 'list', 'search', 'read', 'fetch', 'describe', 'show'];
    const writePatterns = ['create', 'apply', 'update', 'patch', 'delete', 'remove', 'modify'];

    // Match a verb as a whole word: at string start or after a separator (_/-),
    // and followed by a separator or end of string. This prevents false positives
    // like 'get_updates' matching the write pattern 'update'.
    /**
     * Checks for a complete verb token separated by a name boundary.
     *
     * @param name - Lowercase tool name to inspect.
     * @param verb - Read or write verb to match.
     * @returns Whether the verb appears at a start, end, underscore, or hyphen boundary.
     */
    const matchesVerb = (name: string, verb: string): boolean =>
      new RegExp(`(^|[_-])${verb}($|[_-])`).test(name);

    const parallel = tools.filter(tool => {
      const nameLower = tool.name.toLowerCase();
      // If it matches a write pattern, it must be sequential
      if (writePatterns.some(p => matchesVerb(nameLower, p))) {
        return false;
      }
      // If it matches a read pattern or has GET-like arguments, it can be parallel
      if (readPatterns.some(p => matchesVerb(nameLower, p))) {
        return true;
      }
      // For kubernetes_api_request, check the method argument
      if (nameLower === 'kubernetes_api_request') {
        const method =
          typeof tool.arguments?.method === 'string'
            ? tool.arguments.method.toUpperCase()
            : undefined;
        return method === 'GET';
      }
      // Any tool carrying an explicit HTTP method argument: GET is parallel,
      // everything else (POST / PUT / PATCH / DELETE / …) is sequential.
      if (typeof tool.arguments?.method === 'string') {
        return tool.arguments.method.toUpperCase() === 'GET';
      }
      // Default: treat as parallel (reads are more common in orchestration)
      return true;
    });

    const sequential = tools.filter(tool => !parallel.includes(tool));

    // Sort by priority within each group
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    parallel.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    sequential.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { parallel, sequential };
  }

  /**
   * Extracts text from supported model response formats.
   *
   * @param content - Provider response content to normalize.
   * @returns Extracted text, or an empty string when unavailable.
   */
  private static extractTextContent(content: unknown): string {
    return extractResponseText(content);
  }
}
