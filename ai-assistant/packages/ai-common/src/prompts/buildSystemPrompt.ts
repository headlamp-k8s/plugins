/**
 * Pure functions for building the LLM system-prompt strings used by the
 * AI assistant.
 *
 * Tool names, MCP summaries, routed skills, and host context are explicit
 * inputs, keeping prompt composition deterministic and independently testable.
 */

import { basePrompt } from './baseAssistantPrompt';

/** Minimal shape of an MCP tool needed for the system-prompt listing. */
export interface MCPToolSummary {
  /** Tool identifier displayed in the MCP tool list. */
  name: string;
  /** Optional behavior summary displayed beside the tool name. */
  description?: string;
}

/**
 * All runtime values that influence the system prompt.
 */
export interface SystemPromptParams {
  /** Combined list of enabled built-in + extra tool names. */
  availableTools: string[];
  /** MCP tools currently registered; empty when no MCP server is connected. */
  mcpTools: MCPToolSummary[];
  /**
   * Skills text routed for the current query (may be empty string when no
   * skill matched).
   */
  skillsText: string;
  /**
   * Optional freeform context string injected by the host (e.g. selected
   * Kubernetes cluster/namespace info).
   */
  currentContext?: string;
}

// ---------------------------------------------------------------------------
// No-K8s prompt
// ---------------------------------------------------------------------------

/**
 * The system prompt used when the Kubernetes API tool is disabled.
 * Exported so hosts and tests can inspect the exact limitation guidance.
 */
export const NO_K8S_TOOLS_PROMPT = `You are an AI assistant for the Headlamp Kubernetes UI. You help users understand and manage their Kubernetes resources through a web interface.

IMPORTANT: Kubernetes API access tools are currently DISABLED in your settings.

CRITICAL LIMITATIONS:
- You CANNOT access live cluster data (pods, deployments, services, etc.)
- You CANNOT fetch current resource information from the cluster
- You CANNOT retrieve logs, events, or real-time status information
- DO NOT promise to fetch, retrieve, or access any live cluster data

WHAT YOU CAN DO:
- Provide general Kubernetes guidance and explanations
- Generate YAML examples for resource creation
- Explain Kubernetes concepts and best practices
- Help troubleshoot based on information the user provides
- Direct users to enable tools if they need live data access

WHEN USERS ASK FOR LIVE DATA:
- Clearly explain that you cannot access live cluster information
- Inform them that Kubernetes API tools are disabled
- Provide instructions to enable tools in AI Assistant settings
- Offer to help with general guidance instead

YAML FORMATTING:
When providing Kubernetes YAML examples, use this format:

## [Resource Type] Example:

Brief explanation of the resource.

\`\`\`yaml
apiVersion: [version]
kind: [kind]
metadata:
  name: [name]
  namespace: default
spec:
  # Configuration here
\`\`\`

Note: The YAML you provide will be displayed in a preview editor with an "Edit" button that allows users to modify the configuration before applying it to their cluster.

RESPONSES:
- Format responses in markdown
- Be honest about limitations
- Always suggest enabling tools for live data access
- Provide helpful general guidance when possible
- If asked non-Kubernetes questions, politely redirect and include a light Kubernetes joke`;

// ---------------------------------------------------------------------------
// MCP section builder
// ---------------------------------------------------------------------------

/**
 * Builds the MCP-tools section appended to the system prompt when one or more
 * MCP tools are available.
 *
 * Returns an empty string when `mcpTools` is empty so callers can use simple
 * string concatenation without extra conditionals.
 *
 * @param mcpTools - MCP tools to describe in the prompt section.
 * @returns The MCP guidance section, or an empty string when no tools are available.
 */
export function buildMCPToolsSection(mcpTools: MCPToolSummary[]): string {
  if (mcpTools.length === 0) return '';

  const toolList = mcpTools
    .map(tool => `- ${tool.name}: ${tool.description || 'No description'}`)
    .join('\n');

  return `

MCP TOOLS AVAILABLE:
You have access to the following MCP (Model Context Protocol) tools:
${toolList}

CRITICAL - WHEN TO USE MCP TOOLS:
- For ANY user question that matches an available MCP tool → USE IT immediately
- Don't overthink - if there's a tool for it, use it!
- Examples:
  * User asks about time → Use time-related tools (get_current_time, convert_time, etc.)
  * User asks to search → Use search tools
  * User asks about GitHub → Use GitHub tools
  * User asks for debugging/monitoring → Use debugging tools

TOOL USAGE GUIDANCE:

PARAMETER HANDLING:
- When calling MCP tools, read the tool schema carefully and provide the required parameters
- Extract parameters from the user's request (e.g., timezone, location, dates, names, etc.)
- Use context-aware defaults when parameters aren't specified
- If a parameter is unclear, make a reasonable assumption or use the tool's default

RESPONSE FORMATTING:
When MCP tools return data:
1. **Present results clearly** - Format the response in an easy-to-read way
2. **Add context** - Explain what the results mean, don't just show raw data
3. **Be concise** - Summarize when appropriate, don't overwhelm with details
4. **Use appropriate formatting** - Tables for structured data, lists for items, code blocks for technical output

Examples of good MCP tool responses:
- Time query → "The current time is 3:45 PM EST (8:45 PM UTC)"
- Search query → "Found 5 results: [formatted list with key details]"
- Data query → "Here are the top 3 results: [table or list with relevant information]"
- Monitoring query → "Current status: [key metrics and insights]"

ALWAYS interpret results meaningfully - don't just show raw JSON or data dumps.`;
}

// ---------------------------------------------------------------------------
// buildSystemPrompt
// ---------------------------------------------------------------------------

/**
 * Builds the complete system prompt string for a normal (non-tool-response)
 * turn.
 *
 * Logic:
 * 1. Choose base content based on whether `kubernetes_api_request` is enabled.
 * 2. Append the MCP-tools section when any MCP tools are present.
 * 3. Append routed skills text when non-empty.
 * 4. Append current-context block when provided.
 * @param availableTools - Enabled built-in and additional tool identifiers.
 * @param mcpTools - MCP tools available for the current request.
 * @param skillsText - Routed skill instructions to append when non-empty.
 * @param currentContext - Optional host context to append to the prompt.
 * @returns The complete system prompt for a normal assistant turn.
 */
export function buildSystemPrompt({
  availableTools,
  mcpTools,
  skillsText,
  currentContext,
}: SystemPromptParams): string {
  const hasKubernetesTool = availableTools.includes('kubernetes_api_request');
  let content = hasKubernetesTool ? basePrompt : NO_K8S_TOOLS_PROMPT;

  content += buildMCPToolsSection(mcpTools);

  if (skillsText) {
    content += skillsText;
  }

  if (currentContext) {
    content += `\n\nCURRENT CONTEXT:\n${currentContext}`;
  }

  return content;
}

// ---------------------------------------------------------------------------
// buildToolResponseSystemPrompt
// ---------------------------------------------------------------------------

/** Fixed suffix appended to the base prompt during tool-response processing. */
export const TOOL_RESPONSE_INSTRUCTIONS = `

IMPORTANT: You have just received tool execution results. Your task is to:

1. ANALYZE the tool results and provide a clear, helpful response to the user
2. SUMMARIZE the information in a user-friendly way
3. DO NOT call additional tools unless the user explicitly requests more actions
4. FOCUS on explaining what the tools found or accomplished
5. If the tool results show data (like file listings, directories, etc.), present them in a clear, formatted way

The user is waiting for you to explain what the tools discovered. Provide a direct, informative response based on the tool results.`;

/**
 * Builds the specialised system prompt used when the LLM is being asked to
 * summarise completed tool results rather than decide which tools to call.
 *
 * Delegates to `buildSystemPrompt` then appends `TOOL_RESPONSE_INSTRUCTIONS`.
 * @param params - Runtime values used to build the base system prompt.
 * @returns The system prompt with tool-response analysis instructions appended.
 */
export function buildToolResponseSystemPrompt(params: SystemPromptParams): string {
  return buildSystemPrompt(params) + TOOL_RESPONSE_INSTRUCTIONS;
}
