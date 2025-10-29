import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

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

export interface RecommendedTool {
  name: string;
  description: string;
  arguments: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ToolRecommendation {
  tools: RecommendedTool[];
  analysis: string;
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
              z.record(z.any()),
              z.string().transform(v => {
                try {
                  return typeof v === 'string' ? JSON.parse(v) : v;
                } catch {
                  return v;
                }
              }),
            ])
            .describe('Arguments needed for this tool'),
          priority: z
            .enum(['high', 'medium', 'low'])
            .default('medium')
            .describe('Execution priority - high priority tools run first'),
          reason: z.string().describe('Why this tool is needed to answer the user question'),
        })
        .transform(tool => ({
          ...tool,
          name: tool.name || tool.tool_name,
          arguments:
            typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments,
        }))
        .refine(tool => !!tool.name, { message: 'Tool must have either name or tool_name field' })
    )
    .describe('List of tools to execute'),
  shouldExecuteAll: z
    .boolean()
    .default(true)
    .describe('Whether all tools should be executed together for a complete answer'),
});

export class ToolOrchestrator {
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
    availableTools: Array<{ name: string; description: string }>,
    model: BaseChatModel,
    conversationHistory: any[] = [],
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
        ...conversationHistory.filter(
          msg => msg.role === 'system' || msg.role === 'assistant' || msg.role === 'user'
        ),
        new HumanMessage(userPrompt),
      ];

      // Call the model to get tool recommendations
      const response = await model.invoke(messages, { signal });

      // Extract and parse the response
      const responseText = this.extractTextContent(response.content);

      // Try to extract JSON from the response - handle nested braces
      let parsedResponse;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Could not extract JSON from tool orchestrator response:', responseText);
        return {
          tools: [],
          analysis: responseText,
          shouldExecuteAll: false,
        };
      }

      try {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.warn('Failed to parse JSON from response:', jsonMatch[0], parseError);
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
   * Groups tools by execution strategy (parallel vs sequential)
   */
  static groupToolsByExecutionStrategy(tools: RecommendedTool[]): {
    parallel: RecommendedTool[];
    sequential: RecommendedTool[];
  } {
    // Read-only tools (get_*) can execute in parallel
    // Modification tools should execute sequentially
    const parallelPatterns = ['get_', 'list_', 'search_', 'read'];

    const parallel = tools.filter(tool => parallelPatterns.some(p => tool.name.includes(p)));

    const sequential = tools.filter(tool => !parallel.includes(tool));

    // Sort by priority within each group
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    parallel.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    sequential.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { parallel, sequential };
  }

  /**
   * Helper to extract text content from different response formats
   */
  private static extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(item => item && typeof item === 'object' && item.type === 'text')
        .map(item => item.text || '')
        .join('');
    }

    if (content && typeof content === 'object') {
      if (content.text) {
        return content.text;
      }
      if (content.content) {
        return this.extractTextContent(content.content);
      }
    }

    try {
      return String(content || '');
    } catch {
      return '';
    }
  }
}
