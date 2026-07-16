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

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessageChunk, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { buildUserContext } from '../conversation/buildUserContext';
import { isConversationalMessage } from '../conversation/classifyMessage';
import { extractTextContent, processToolContent } from '../conversation/content';
import {
  findLastAssistantWithTools,
  getLastAssistantMessage,
  hasToolResponses,
  sanitizeToolAlignment,
  validateToolCallAlignment,
} from '../conversation/history';
import { convertPromptsToMessages } from '../conversation/langchain/messages';
import type { ConversationMessage } from '../conversation/types';
import { MCPArgumentProcessor } from '../mcp/tools/ArgumentProcessor';
import type { MCPToolSchema, UserContext } from '../mcp/tools/types';
import { buildSystemPrompt, buildToolResponseSystemPrompt } from '../prompts/buildSystemPrompt';
import {
  createArgumentPreparationPrompt,
  getIntelligentDefault,
} from '../prompts/buildToolArgumentPrompt';
import {
  apiErrorPromptTemplate,
  toolFailurePromptTemplate,
} from '../prompts/langchain/errorPrompts';
import { canUseDirectToolCalling, createChatModel } from '../providers/createChatModel';
import { ProviderSettings } from '../providers/savedConfigs';
import { redactSecrets } from '../security/redactSecrets';
import { DEFAULT_SKILLS_CONFIG, SkillsConfig } from '../skills/config';
import { SkillManager } from '../skills/SkillManager';
import {
  inlineToolApprovalManager,
  ToolConfirmationEvent,
} from '../tools/approval/InlineToolApprovalManager';
import {
  identifyEnhancedFields,
  parseArgumentsFromResponse,
} from '../tools/arguments/parseToolArguments';
import {
  buildDisabledToolsMessage,
  filterToolCallsByEnabled,
  mergeApprovedArguments,
  NormalizedToolCall,
  normalizeLLMToolCalls,
  shouldProcessToolFollowUp,
} from '../tools/calls/processToolCalls';
import { getToolDescription } from '../tools/catalog/getToolDescription';
import { isBuiltInTool, isSensitiveBuiltInToolCall } from '../tools/catalog/toolDefinitions';
import type { KubernetesToolContext } from '../tools/kubernetes/context';
import { containsKubectlSuggestion } from '../tools/kubernetes/detectCliSuggestion';
import { LangChainToolManager } from '../tools/langchain/LangChainToolManager';
import { RecommendedTool, ToolPlanner } from '../tools/langchain/ToolPlanner';
import {
  buildMultiToolErrorPrompt,
  buildOrchestrationToolError,
  filterApprovedOrchestrationTools,
  shouldCacheResponse,
} from '../tools/orchestration/prepareToolPlan';
import {
  assembleFallbackResponseContent,
  buildConfirmationPlaceholderJson,
  buildFailedOperationsFallback,
  buildToolExecutionErrorJson,
  detectToolResponseError,
} from '../tools/results/buildToolResponse';
import {
  aggregateToolResults,
  formatToolResultsForLLM,
  ToolResult,
} from '../tools/results/formatToolResults';
import {
  buildToolDataAnalysisRequest,
  fillMissingRequiredFields,
  isRegularConversationMessage,
} from '../tools/results/prepareToolResponse';
import type { ToolCall } from '../tools/types';
import AssistantSession from './AssistantSession';
import {
  CacheEntry,
  evictExpired,
  evictOldestToFit,
  generateCacheKey,
} from './cache/responseCache';
import { isApiRelatedError, toUserFriendlyError } from './errors/formatAssistantError';
import type { LangChainToolRuntime } from './langchain/LangChainToolBinding';
import {
  createLLMResultCapture,
  mergeContentAcrossGenerations,
  mergeToolCallsAcrossGenerations,
} from './langchain/mergeGenerations';
import {
  getRecentToolResponses,
  isEmptyLLMContent,
  isMCPFormattedOutput,
  mapCorrectedResponseToolCalls,
} from './responses/inspectResponse';

/** Input required to invoke a prompt-template chain. */
interface ChainInput {
  /** System instructions prepended to the request. */
  systemPrompt: string;
  /** Prior conversation messages. */
  chatHistory: BaseMessage[];
  /** Current user input. */
  input: string;
}

/** Input passed to the tool-response summarization model. */
interface ToolResponseChainInput {
  /** Specialized system instructions for interpreting tool results. */
  systemPrompt: string;
  /** Conversation and tool-result messages to summarize. */
  messages: BaseMessage[];
}

/** Model response fields consumed by tool-call handling. */
interface ModelToolResponse {
  /** Text or multimodal content returned by the model. */
  content: unknown;
  /** Untrusted tool calls returned by the model. */
  tool_calls?: unknown[];
}

/** Base or tool-bound chat model that can be invoked with LangChain messages. */
type InvokableChatModel = BaseChatModel | ReturnType<NonNullable<BaseChatModel['bindTools']>>;

/** Minimal externally supplied tool contract used by CLI and tests. */
interface ExtraTool {
  /** Registered name used in model tool calls. */
  name: string;
  /**
   * Executes the tool with model-generated input.
   *
   * @param input - Untrusted input supplied by the model.
   * @returns Tool-specific result synchronously or asynchronously.
   */
  invoke(input: unknown): Promise<unknown> | unknown;
}

/**
 * Parses normalized tool arguments without allowing malformed JSON to abort a request.
 *
 * @param serialized - Candidate JSON object string.
 * @returns Parsed non-array object, or an empty object on invalid or non-object input.
 */
function parseSerializedToolArguments(serialized: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(serialized);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Coordinates model calls, tool execution, and chat history for the AI assistant. */
export default class LangChainAssistantSession extends AssistantSession {
  private model: BaseChatModel;
  private boundModel: InvokableChatModel | null = null;
  private providerId: string;
  private toolManager: LangChainToolRuntime;
  private kubernetesContext: KubernetesToolContext | undefined;
  private currentAbortController: AbortController | null = null;
  private promptTemplate: ChatPromptTemplate;
  private outputParser: StringOutputParser;
  private useDirectToolCalling: boolean = false;
  /** Extra LangChain tools provided externally (e.g. kubectl for CLI). */
  private extraTools: Map<string, ExtraTool> = new Map();

  // Skills system
  private skillManager: SkillManager | null = null;
  private skillsConfig: SkillsConfig = DEFAULT_SKILLS_CONFIG;
  /** Skills prompt text for the current request (computed per-message, transient). */
  private currentSkillsPromptText: string = '';

  // Response cache for common queries (in-memory)
  private responseCache: Map<string, CacheEntry<ConversationMessage>> = new Map();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 30; // Maximum cached responses

  /** Creates a LangChain assistant session for the selected provider and enabled tools.
   *
   * @param providerId   - Provider key recognised by `createLangChainModel`.
   * @param config       - Provider-specific configuration (API keys, endpoints…).
   * @param enabledTools - Built-in tool allowlist; absence becomes an empty allowlist.
   * @param options      - Optional overrides for testing / CLI / demo use.
   * @param options.toolManager - Inject a custom tool runtime (or
   *   `MockToolManager`) instead of creating the default one.  Use this in
   *   tests and CLI sessions that don't need a real Kubernetes connection:
   *   ```ts
   *   import { createMockToolManager } from
   *     '@headlamp-k8s/ai-common/tools/testing/MockToolManager';
   *   const session = new LangChainAssistantSession('mock-testing-model', {}, [], {
   *     toolManager: createMockToolManager({
   *       enabledToolNames: ['kubernetes_api_request'],
   *       toolResults: { kubernetes_api_request: { items: [] } },
   *     }),
   *   });
   *   ```
   */
  constructor(
    providerId: string,
    config: ProviderSettings,
    enabledTools?: string[],
    options?: {
      /** Optional replacement tool runtime for tests, CLI, or demos. */
      toolManager?: LangChainToolRuntime;
    }
  ) {
    super();
    this.providerId = providerId;
    const enabledToolIds = enabledTools ?? [];
    console.debug(
      'AI Assistant: Initializing with enabled tools:',
      enabledToolIds || 'all tools enabled'
    );
    this.toolManager = options?.toolManager ?? new LangChainToolManager({ enabledToolIds });
    this.model = this.createModel(providerId, config);

    // Initialize prompt template and output parser
    this.promptTemplate = this.createPromptTemplate();
    this.outputParser = new StringOutputParser();

    // Set up event listeners for inline tool confirmations
    this.setupToolConfirmationListeners();
  }

  /**
   * Configures the skill manager for prompt skill injection.
   *
   * When configured, skills are automatically routed per-query and
   * injected into the system prompt. Uses embedding-based routing
   * when an {@link EmbeddingSkillRouter} is set on the manager, otherwise
   * falls back to keyword-based routing.
   *
   * @param skillManager - Initialized manager, or `null` to disable skill injection.
   * @param skillsConfig - The user's skills configuration.
   * @returns No value.
   */
  setSkillManager(skillManager: SkillManager | null, skillsConfig: SkillsConfig): void {
    this.skillManager = skillManager;
    this.skillsConfig = skillsConfig;
    this.currentSkillsPromptText = '';
    this.responseCache.clear();
  }

  /**
   * Updates the skills configuration without replacing the skill manager.
   *
   * @param skillsConfig - The updated skills configuration.
   * @returns No value.
   */
  setSkillsConfig(skillsConfig: SkillsConfig): void {
    this.skillsConfig = skillsConfig;
    this.currentSkillsPromptText = '';
    this.responseCache.clear();
  }

  /**
   * Computes the routed skills prompt text for a user query.
   *
   * Returns empty string if no skill manager is configured or no skills
   * are available. Handles errors gracefully — skill routing failures
   * never block the main LLM call.
   *
   * @param query - User query used for skill routing.
   * @returns Routed skill prompt text, or an empty string when unavailable or failed.
   */
  private async getSkillsPromptForQuery(query: string): Promise<string> {
    if (!this.skillManager) return '';

    try {
      // Ensure skills are loaded
      await this.skillManager.loadAllSkills(this.skillsConfig);
      return await this.skillManager.getRoutedSkillsPromptText(query, this.skillsConfig);
    } catch (error) {
      console.warn('LangChainManager: skills routing failed, proceeding without skills:', error);
      return '';
    }
  }

  /**
   * Registers global inline-confirmation listeners that mutate this session's history.
   *
   * @returns No value.
   */
  private setupToolConfirmationListeners(): void {
    inlineToolApprovalManager.on('request-confirmation', (value: unknown) => {
      if (!this.isToolConfirmationEvent(value)) return;
      // Add the tool confirmation message to chat history
      this.addToolConfirmationMessage('', value.toolConfirmation);
    });

    inlineToolApprovalManager.on('update-confirmation', (value: unknown) => {
      if (!this.isToolConfirmationEvent(value)) return;
      // Update the specific tool confirmation message with new state (e.g., loading)
      this.updateToolConfirmationMessage(value.requestId, value.toolConfirmation);
    });
  }

  /**
   * Checks the minimum shape required for a tool-confirmation event.
   *
   * @param value - Unknown emitted value.
   * @returns Whether request ID and confirmation object are present.
   */
  private isToolConfirmationEvent(value: unknown): value is ToolConfirmationEvent {
    return (
      typeof value === 'object' &&
      value !== null &&
      'requestId' in value &&
      typeof value.requestId === 'string' &&
      'toolConfirmation' in value &&
      typeof value.toolConfirmation === 'object' &&
      value.toolConfirmation !== null
    );
  }

  /**
   * Extracts text from supported LangChain content forms.
   *
   * @param content - Model or message content to normalize.
   * @returns Extracted text, or an empty string for unsupported content.
   */
  private extractTextContent(content: unknown): string {
    return extractTextContent(content);
  }

  /**
   * Aborts the currently running model request, if one exists.
   *
   * @returns No value.
   */
  abort(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  /**
   * Streaming version of userSend for better perceived performance
   * Yields content as it's generated by the model
   *
   * Cache hits yield one complete response. Cache misses stream model text,
   * accumulate tool-call chunks, execute tools, and stream any follow-up.
   * Unlike `userSend`, errors are rethrown after clearing the abort controller.
   *
   * @param message - User message appended to history and sent to the model.
   * @returns Generator yielding text chunks and returning the final assistant message.
   */
  async *userSendStream(message: string): AsyncGenerator<string, ConversationMessage, undefined> {
    const userPrompt: ConversationMessage = { role: 'user', content: message };
    this.history.push(userPrompt);

    // Check cache first
    const cacheKey = generateCacheKey(this.history, message);
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      // Cache hit - yield entire cached response at once
      yield cached.value.content;
      this.history.push(cached.value);
      return cached.value;
    }

    // Create abort controller for this request
    this.currentAbortController = new AbortController();

    try {
      const modelToUse = this.boundModel || this.model;

      // Route skills for this query (async, with fallback)
      this.currentSkillsPromptText = await this.getSkillsPromptForQuery(message);

      // Prepare messages
      const messages = [
        new SystemMessage(this.createSystemPrompt()),
        ...this.prepareChatHistory(),
        new HumanMessage(message),
      ];

      // Stream the response
      const stream = await modelToUse.stream(messages, {
        signal: this.currentAbortController?.signal,
      });

      let fullContent = '';
      let accumulatedChunk: AIMessageChunk | undefined;

      for await (const chunk of stream) {
        const content = this.extractTextContent(chunk.content);
        if (content) {
          fullContent += content;
          yield content;
        }

        // Accumulate all chunks so we can read complete tool_calls at the end.
        // chunk.tool_calls during streaming contains only partial data
        // (tool_call_chunks); concat() merges them into complete tool_calls.
        accumulatedChunk = accumulatedChunk
          ? (accumulatedChunk.concat(chunk) as AIMessageChunk)
          : chunk;
      }

      // Read tool calls from the fully-accumulated message.
      // This correctly handles providers (e.g. Claude via Copilot) that send
      // tool calls as separate streaming chunks rather than in the first chunk.
      const toolCalls = accumulatedChunk?.tool_calls ?? [];

      this.currentAbortController = null;

      // Create the complete response
      const assistantPrompt: ConversationMessage = {
        role: 'assistant',
        content: fullContent,
        toolCalls:
          toolCalls.length > 0
            ? toolCalls.map(tc => ({
                type: 'function',
                id: tc.id,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.args || {}),
                },
              }))
            : undefined,
      };

      // If there are tool calls, handle them with streaming
      if (toolCalls.length > 0) {
        this.history.push(assistantPrompt);

        // Execute tool calls (this is fast - 7-14ms)
        await this.handleToolCallsForStreaming(toolCalls, assistantPrompt);

        // Stream the follow-up response after tool execution
        for await (const chunk of this.processToolResponsesStream()) {
          yield chunk;
        }

        // Return the final response (already added to history by processToolResponsesStream)
        return this.history[this.history.length - 1];
      }

      this.history.push(assistantPrompt);

      // Cache non-tool responses
      if (!assistantPrompt.toolCalls || assistantPrompt.toolCalls.length === 0) {
        this.responseCache.set(cacheKey, {
          value: { ...assistantPrompt },
          timestamp: Date.now(),
        });

        if (this.responseCache.size % 5 === 0) {
          this.cleanResponseCache();
        }

        // Clear progress steps for non-tool responses
      }

      return assistantPrompt;
    } catch (error) {
      this.currentAbortController = null;
      throw error;
    }
  }

  /**
   * Creates the reusable system, history, and user prompt template.
   *
   * @returns Configured chat prompt template.
   */
  private createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system', '{systemPrompt}'],
      new MessagesPlaceholder('chatHistory'),
      ['human', '{input}'],
    ]);
  }

  /**
   * Creates a prompt, current-model, and string-parser chain.
   *
   * @returns Runnable chain using the bound model when present.
   */
  private createBasicChain() {
    const modelToUse = this.boundModel || this.model;
    return this.promptTemplate.pipe(modelToUse).pipe(this.outputParser);
  }

  /**
   * Extract the base URL from an Azure OpenAI endpoint.
   * Users may paste the full API URL (e.g., https://xxx.openai.azure.com/openai/v1/chat/completions)
   * but the SDK expects only the base URL (e.g., https://xxx.openai.azure.com).
   *
   * @param endpoint - Full or partial endpoint string.
   * @returns Parsed origin, or the original string without trailing slashes when invalid.
   */
  private extractAzureBaseUrl(endpoint: string): string {
    try {
      const url = new URL(endpoint);
      // Return only the origin (protocol + host), stripping any path
      return url.origin;
    } catch {
      // If URL parsing fails, fall back to stripping trailing slashes
      return endpoint.replace(/\/+$/, '');
    }
  }

  /**
   * Creates a provider chat model, normalizing Azure endpoints first.
   *
   * @param providerId - Provider catalog identifier.
   * @param config - Provider-specific settings.
   * @returns Configured LangChain chat model.
   */
  private createModel(providerId: string, config: ProviderSettings): BaseChatModel {
    // Delegate to the shared standalone function; handle Azure endpoint extraction here
    // since that requires the private extractAzureBaseUrl method.
    if (providerId === 'azure') {
      /**
       * Normalizes an unknown Azure endpoint value.
       *
       * @param v - Candidate endpoint.
       * @returns Trimmed string or an empty string.
       */
      const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      const endpoint = this.extractAzureBaseUrl(s(config.endpoint));
      return createChatModel(providerId, { ...config, endpoint });
    }
    return createChatModel(providerId, config);
  }

  /**
   * Configures Kubernetes context and binds discovered tools to the model.
   *
   * @param _tools - Unused compatibility parameter.
   * @param kubernetesContext - Context supplied to Kubernetes-aware tools.
   * @returns No value after MCP initialization and model binding.
   */
  async configureTools(_tools: unknown[], kubernetesContext: KubernetesToolContext): Promise<void> {
    await this.toolManager.waitForMCPToolsInitialization();

    // Configure the Kubernetes context for the KubernetesTool
    this.toolManager.configureKubernetesContext(kubernetesContext);
    this.kubernetesContext = kubernetesContext;

    // Get all tools (including MCP tools)
    const allTools = this.toolManager.getLangChainTools();

    // Bind all tools to the model for compatible providers (OpenAI, Azure, etc.)
    // Use the async version to ensure MCP tools are properly included
    this.boundModel = await this.toolManager.bindToModelAsync(this.model, this.providerId);

    // Enable direct tool calling for better performance
    if (allTools.length > 0 && this.canUseDirectToolCalling()) {
      this.useDirectToolCalling = true;
    }
  }

  /**
   * Gets the Kubernetes context last supplied to `configureTools`.
   *
   * @returns Current context, or `undefined` before configuration.
   */
  getKubernetesContext(): KubernetesToolContext | undefined {
    return this.kubernetesContext;
  }

  /**
   * Enables direct tool calling without requiring a full KubernetesToolContext.
   * Useful for CLI or headless environments where UI callbacks are not available.
   * Accepts optional extra LangChain tools to bind alongside the built-in ones.
   *
   * @param extraTools - Optional externally supplied tools, registered by name.
   * @returns No value; unsupported providers remain unchanged.
   */
  async enableDirectToolCalling(extraTools?: ExtraTool[]): Promise<void> {
    if (this.canUseDirectToolCalling()) {
      await this.toolManager.waitForMCPToolsInitialization();
      // Register extra tools so they can be found during execution
      if (extraTools) {
        for (const t of extraTools) {
          this.extraTools.set(t.name, t);
        }
      }
      const builtinTools = this.toolManager.getLangChainTools();
      const allTools = [...builtinTools, ...(extraTools ?? [])];
      if (allTools.length > 0 && this.model.bindTools) {
        const bindableTools = allTools as Parameters<NonNullable<BaseChatModel['bindTools']>>[0];
        this.boundModel = this.model.bindTools(bindableTools);
      } else {
        this.boundModel = this.model;
      }
      this.useDirectToolCalling = true;
    }
  }

  /**
   * Checks whether the current provider supports direct tool calling.
   *
   * @returns Provider capability result.
   */
  private canUseDirectToolCalling(): boolean {
    return canUseDirectToolCalling(this.providerId);
  }

  /**
   * Builds user context from current conversation history.
   *
   * @returns Context snapshot used for argument enhancement and approval.
   */
  private buildUserContext(): UserContext {
    return buildUserContext(this.history);
  }

  /**
   * Gets a tool description for approval display.
   *
   * @param toolName - Built-in or MCP tool name.
   * @param isMCPTool - Whether MCP-specific fallback wording should be used.
   * @returns Human-readable tool description.
   */
  private getToolDescription(toolName: string, isMCPTool: boolean): string {
    return getToolDescription(toolName, isMCPTool);
  }

  /**
   * Adds a display-only tool confirmation message to history.
   *
   * @param content - Display content.
   * @param toolConfirmation - Confirmation controls and request metadata.
   * @param updateHistoryCallback - Optional UI notification callback.
   * @returns No value.
   */
  public addToolConfirmationMessage(
    content: string,
    toolConfirmation: NonNullable<ConversationMessage['toolConfirmation']>,
    updateHistoryCallback?: () => void
  ): void {
    const confirmationPrompt: ConversationMessage = {
      role: 'assistant',
      content: content,
      toolConfirmation: toolConfirmation,
      isDisplayOnly: true, // Don't send to LLM
      requestId: toolConfirmation.requestId, // Add requestId for tracking
    };
    this.history.push(confirmationPrompt);

    // Call the update callback if provided to trigger UI re-render
    if (updateHistoryCallback) {
      updateHistoryCallback();
    }
  }

  /**
   * Updates a matching tool confirmation message in chat history.
   *
   * @param requestId - Request ID used to locate the display message.
   * @param updatedToolConfirmation - Replacement confirmation state.
   * @returns No value.
   */
  public updateToolConfirmationMessage(
    requestId: string,
    updatedToolConfirmation: NonNullable<ConversationMessage['toolConfirmation']>
  ): void {
    // Find the message with matching requestId
    const messageIndex = this.history.findIndex(
      prompt => prompt.requestId === requestId && prompt.toolConfirmation
    );

    if (messageIndex !== -1) {
      // Update the tool confirmation in the existing message
      this.history[messageIndex] = {
        ...this.history[messageIndex],
        toolConfirmation: updatedToolConfirmation,
      };

      // Use the inline tool approval manager to emit update event
      inlineToolApprovalManager.emit('message-updated', { requestId, updatedToolConfirmation });
    } else {
      console.warn('⚠️ LangChainManager: Could not find tool confirmation message to update');
    }
  }

  /**
   * Refresh MCP tools when configuration changes.
   * Re-fetches tools through the runtime and rebinds the model.
   *
   * @returns No value.
   */
  public async refreshMCPTools(): Promise<void> {
    await this.toolManager.refreshMCPTools();
    // Rebind the model to update tool bindings
    if (this.model) {
      this.boundModel = await this.toolManager.bindToModelAsync(this.model, this.providerId);
    }
  }

  /**
   * Clear the most recent tool confirmation message from history
   * Called after tool execution completes to hide the loading dialog
   *
   * @returns No value.
   */
  public clearToolConfirmation(): void {
    // Find the most recent tool confirmation message (from the end)
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].toolConfirmation) {
        // Remove this message from history
        this.history.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Filters display/system entries, repairs tool alignment, and converts history.
   *
   * @returns LangChain messages safe for prompt invocation.
   */
  private prepareChatHistory(): BaseMessage[] {
    // Filter out system messages and display-only messages to avoid conflicts with the system message in the prompt template
    const filteredHistory = this.history.filter(
      prompt => prompt.role !== 'system' && !prompt.isDisplayOnly
    );
    // Sanitize tool_use / tool_result alignment so Anthropic doesn't reject the
    // request.  Two invariants must hold:
    //   1. Every assistant message with tool_calls must be followed immediately
    //      by tool_result messages for each tool_call id.
    //   2. Every tool_result message must have a matching tool_use in the
    //      preceding assistant message.
    // When filtering removes display-only tool results (e.g. confirmation
    // placeholders) we can end up violating (1).  Fix by stripping tool_calls
    // whose results are missing, and dropping orphan tool messages.
    const sanitized = sanitizeToolAlignment(filteredHistory);
    return convertPromptsToMessages(sanitized);
  }

  /**
   * Creates the request system prompt from tools, skills, and current context.
   *
   * @returns System prompt text.
   */
  private createSystemPrompt(): string {
    return buildSystemPrompt({
      availableTools: [...this.toolManager.getToolNames(), ...this.extraTools.keys()],
      mcpTools: this.toolManager.getMCPTools(),
      skillsText: this.currentSkillsPromptText,
      currentContext: this.currentContext,
    });
  }

  /**
   * Creates specialized instructions for summarizing tool responses.
   *
   * @returns Tool-response system prompt text.
   */
  private createToolResponseSystemPrompt(): string {
    return buildToolResponseSystemPrompt({
      availableTools: [...this.toolManager.getToolNames(), ...this.extraTools.keys()],
      mcpTools: this.toolManager.getMCPTools(),
      skillsText: this.currentSkillsPromptText,
      currentContext: this.currentContext,
    });
  }

  /**
   * Evicts expired responses and oldest entries beyond the 30-entry limit.
   *
   * Entries expire after ten minutes.
   *
   * @returns No value.
   */
  private cleanResponseCache(): void {
    evictExpired(this.responseCache, this.CACHE_TTL_MS);
    evictOldestToFit(this.responseCache, this.MAX_CACHE_SIZE);
  }

  /**
   * Processes a user message through cache, skills, tools, and model fallbacks.
   *
   * Errors inside the main model/tool processing block are converted into
   * assistant error messages. Auto-approval settings are synchronized before
   * that catch boundary. Successful cacheable non-tool responses are retained
   * for ten minutes.
   *
   * @param message - User text appended to conversation history.
   * @returns Final assistant, tool-derived, denial, or error message.
   */
  async userSend(message: string): Promise<ConversationMessage> {
    // Sync MCP auto-approve settings before processing
    await inlineToolApprovalManager.loadAndApplyAutoApproveSettings();

    // Clear previous progress steps

    const userPrompt: ConversationMessage = { role: 'user', content: message };
    this.history.push(userPrompt);

    // Check cache first for non-tool-dependent queries
    const cacheKey = generateCacheKey(this.history, message);
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      // Cache hit - return cached response
      this.history.push(cached.value);
      return cached.value;
    }

    // Create abort controller for this request
    this.currentAbortController = new AbortController();

    try {
      // Route skills for this query (async, with graceful fallback)
      this.currentSkillsPromptText = await this.getSkillsPromptForQuery(message);

      // FIRST: Try to orchestrate multiple relevant tools before making LLM call
      // This enables multi-tool execution for comprehensive responses
      const recommendedTools = await this.orchestrateToolsForRequest(message);

      if (recommendedTools && recommendedTools.length > 0) {
        // Execute multiple tools together for a comprehensive response
        return await this.handleMultipleToolExecution(message, recommendedTools);
      }

      // FALLBACK: Use direct tool calling if enabled
      if (this.useDirectToolCalling) {
        return await this.handleDirectToolCallingRequest(message);
      }
      const modelToUse = this.boundModel || this.model;

      // For local models, use simplified approach
      if (this.providerId === 'local') {
        return await this.handleLocalModelRequest(message, modelToUse);
      }

      // Use chain-based approach for other models
      const response = await this.handleChainBasedRequest(message, modelToUse);

      // Cache successful non-tool responses
      if (shouldCacheResponse(response)) {
        this.responseCache.set(cacheKey, {
          value: { ...response },
          timestamp: Date.now(),
        });

        // Clean cache periodically
        if (this.responseCache.size % 5 === 0) {
          this.cleanResponseCache();
        }
      }

      return response;
    } catch (error) {
      return this.handleUserSendError(error);
    }
  }

  /**
   * Invokes a tool-bound model and merges content and calls across generations.
   *
   * Failure disables direct calling and falls back to the chain-based path.
   *
   * @param message - Current user message.
   * @returns Assistant text or tool-derived response.
   */
  private async handleDirectToolCallingRequest(message: string): Promise<ConversationMessage> {
    try {
      const modelToUse = this.boundModel || this.model;

      // Prepare input for the model with tools
      const chainInput = {
        systemPrompt: this.createSystemPrompt(),
        chatHistory: this.prepareChatHistory(),
        input: message,
      };

      // Convert chain input to messages
      const messages = [
        new SystemMessage(chainInput.systemPrompt),
        ...chainInput.chatHistory,
        new HumanMessage(chainInput.input),
      ];

      // Capture the full LLMResult via callback so we can access ALL generations.
      // The Copilot API may split text and tool_calls across multiple "choices":
      //   - Choice 0: text content, tool_calls: []
      //   - Choice 1+: tool_calls with actual function calls
      // invoke() only returns the first choice, losing the tool calls.
      // The callback fires synchronously before invoke() returns.
      const capture = createLLMResultCapture();

      const result = await modelToUse.invoke(messages, {
        signal: this.currentAbortController?.signal,
        callbacks: [capture.callback],
      });

      this.currentAbortController = null;

      const allToolCalls = mergeToolCallsAcrossGenerations(
        result.tool_calls ?? [],
        capture.getResult()
      );
      const fullContent = mergeContentAcrossGenerations(
        this.extractTextContent(result.content),
        capture.getResult(),
        c => this.extractTextContent(c)
      );

      // Handle tool calls if present (from any generation)
      if (allToolCalls.length > 0) {
        const mergedResponse = {
          content: result.content,
          tool_calls: allToolCalls,
        };
        return await this.handleToolCalls(mergedResponse);
      } else {
        // Handle regular response
        const assistantPrompt: ConversationMessage = {
          role: 'assistant',
          content: fullContent,
        };
        this.history.push(assistantPrompt);

        return assistantPrompt;
      }
    } catch (error) {
      console.error('Error in direct tool calling request:', error);

      // If direct tool calling fails, fall back to regular approach
      this.useDirectToolCalling = false;

      const modelToUse = this.boundModel || this.model;
      return await this.handleChainBasedRequest(message, modelToUse);
    }
  }

  /**
   * Invokes a local model with only system and current-user messages.
   *
   * @param message - Current user message.
   * @param model - Model to invoke.
   * @returns Assistant text message added to history.
   */
  private async handleLocalModelRequest(
    message: string,
    model: InvokableChatModel
  ): Promise<ConversationMessage> {
    const systemMessage = new SystemMessage(this.createSystemPrompt());
    const userMessage = new HumanMessage(message);
    const messages = [systemMessage, userMessage];

    const response = await model.invoke(messages, {
      signal: this.currentAbortController?.signal,
    });

    this.currentAbortController = null;

    const assistantPrompt: ConversationMessage = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
    };
    this.history.push(assistantPrompt);

    // Clear progress steps for local model responses

    return assistantPrompt;
  }

  /**
   * Handles a request through tool-enabled invocation or the basic text chain.
   *
   * @param message - Current user message.
   * @param model - Base or bound model.
   * @returns Assistant text or tool-derived response.
   */
  private async handleChainBasedRequest(
    message: string,
    model: InvokableChatModel
  ): Promise<ConversationMessage> {
    // Prepare input for the chain
    const chainInput = {
      systemPrompt: this.createSystemPrompt(),
      chatHistory: this.prepareChatHistory(),
      input: message,
    };

    // For models with tools, use direct invocation to handle tool calls
    if (this.boundModel) {
      return await this.handleToolEnabledRequest(chainInput, model);
    }

    // For simple requests without tools, use the chain
    const chain = this.createBasicChain();
    const response = await chain.invoke(chainInput, {
      signal: this.currentAbortController?.signal,
    });

    this.currentAbortController = null;

    const assistantPrompt: ConversationMessage = {
      role: 'assistant',
      content: this.extractTextContent(response),
    };
    this.history.push(assistantPrompt);

    // Clear progress steps for chain-based responses

    return assistantPrompt;
  }

  /**
   * Invokes a tool-enabled model and merges tool calls across generations.
   *
   * @param chainInput - System prompt, sanitized history, and current input.
   * @param model - Fallback model when no bound model is present.
   * @returns Assistant text or tool-derived response.
   */
  private async handleToolEnabledRequest(
    chainInput: ChainInput,
    model: InvokableChatModel
  ): Promise<ConversationMessage> {
    // Convert chain input to messages for tool-enabled models
    const messages = [
      new SystemMessage(chainInput.systemPrompt),
      ...chainInput.chatHistory,
      new HumanMessage(chainInput.input),
    ];

    // IMPORTANT: Use the boundModel (which has tools) instead of the original model
    const modelToUse = this.boundModel || model;

    // Capture full LLMResult for multi-generation merging (same as handleDirectToolCallingRequest)
    const capture = createLLMResultCapture();

    const response = await modelToUse.invoke(messages, {
      signal: this.currentAbortController?.signal,
      callbacks: [capture.callback],
    });

    this.currentAbortController = null;

    const toolCalls = mergeToolCallsAcrossGenerations(
      response.tool_calls ?? [],
      capture.getResult()
    );

    // Handle tool calls if present
    if (toolCalls.length > 0) {
      const mergedResponse = { content: response.content, tool_calls: toolCalls };
      return await this.handleToolCalls(mergedResponse);
    }

    // Handle regular response
    const assistantPrompt: ConversationMessage = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
    };
    this.history.push(assistantPrompt);

    return assistantPrompt;
  }

  /**
   * Analyze user request to determine ALL relevant tools that should be executed together.
   * Only triggers when MCP tools are available (built-in K8s tool uses direct tool calling).
   * This avoids an extra LLM call for every message when only K8s tool is present.
   *
   * Only MCP tools are offered to the planner, and recommendations are used only
   * when at least two tools should execute. Failures return `null`.
   *
   * @param userMessage - User request and recent-history planning input.
   * @returns Multiple recommended MCP tools, or `null` to use normal model flow.
   */
  private async orchestrateToolsForRequest(userMessage: string): Promise<RecommendedTool[] | null> {
    try {
      // Only orchestrate when MCP tools are available
      // The built-in K8s tool works fine with direct tool calling and doesn't need orchestration
      const mcpTools = this.toolManager.getMCPTools();
      if (mcpTools.length === 0) {
        return null;
      }

      // Quick pre-check: skip orchestration for very short or clearly conversational messages
      // to avoid an expensive LLM call on every message
      if (isConversationalMessage(userMessage)) {
        return null;
      }

      const enabledToolIds = this.toolManager.getToolNames();

      if (enabledToolIds.length === 0) {
        return null;
      }

      // IMPORTANT: Only pass MCP tools to the orchestrator, NOT built-in tools.
      // Built-in tools like kubernetes_api_request work much better with the LLM's
      // native tool calling where the model generates proper URLs with actual values.
      // The orchestrator generates template URLs like /api/v1/namespaces/{namespace}
      // which don't work as real API requests.
      const availableTools = mcpTools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
      }));

      // If no MCP tools to orchestrate, skip
      if (availableTools.length === 0) {
        return null;
      }

      // Use ToolOrchestrator to analyze and recommend tools
      const recommendation = await ToolPlanner.analyzeAndRecommendTools(
        userMessage,
        availableTools,
        this.model,
        this.history.slice(-10), // Pass last 10 messages for context
        this.currentAbortController?.signal
      );

      // Only use orchestration when multiple tools are recommended.
      // Single tool recommendations should use the normal direct tool calling flow
      // which produces better arguments (especially for kubernetes_api_request).
      if (recommendation.shouldExecuteAll && recommendation.tools.length >= 2) {
        return recommendation.tools;
      }

      // Single or zero tools — let the normal LLM tool-calling flow handle it
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Execute multiple tools together based on orchestration recommendation
   * Requests approval before executing each batch of tools
   * Collects results and provides a comprehensive response
   *
   * MCP arguments are enhanced before approval. Approved tools are grouped into
   * parallel and sequential phases, and all execution failures become result data.
   *
   * @param userMessage - Original request used for final response generation.
   * @param recommendedTools - Planner recommendations with arguments and priorities.
   * @returns Synthesized, denial, fallback, or orchestration-error assistant message.
   */
  private async handleMultipleToolExecution(
    userMessage: string,
    recommendedTools: RecommendedTool[]
  ): Promise<ConversationMessage> {
    try {
      // Prepare tools with enhanced arguments (using same pattern as regular tool execution)
      const toolsForApproval = await Promise.all(
        recommendedTools.map(async tool => {
          const isMCPTool = !isBuiltInTool(tool.name);
          let processedArguments = tool.arguments || {};

          // Use AI to enhance arguments for MCP tools (same as regular flow)
          if (isMCPTool) {
            try {
              const toolSchema = await MCPArgumentProcessor.getToolSchema(tool.name);
              if (toolSchema) {
                // Build user context from current conversation
                const userContext = this.buildUserContext();

                // Store original arguments for comparison
                const originalArguments = { ...processedArguments };

                // Use AI to intelligently prepare arguments
                processedArguments = await this.enhanceArgumentsWithAI(
                  tool.name,
                  toolSchema,
                  userContext,
                  processedArguments
                );

                // Mark which fields were enhanced by LLM for UI display
                processedArguments._llmEnhanced = {
                  enhanced: true,
                  originalArgs: originalArguments,
                  enhancedFields: identifyEnhancedFields(originalArguments, processedArguments),
                };
              }
            } catch (error) {
              console.warn(`Failed to enhance arguments for ${tool.name}:`, error);
              // Fall back to original arguments
            }
          }

          return {
            id: `orchestrated-${tool.name}-${Date.now()}`,
            name: tool.name,
            description: tool.description,
            arguments: processedArguments,
            type: (isMCPTool ? 'mcp' : 'regular') as ToolCall['type'],
            priority: tool.priority,
            reason: tool.reason,
          };
        })
      );

      const approvedToolIds: string[] = [];

      // Separate built-in tools from MCP tools (same pattern as handleToolCalls)
      const builtInToolsForApproval = toolsForApproval.filter(tool => isBuiltInTool(tool.name));
      const mcpToolsForApproval = toolsForApproval.filter(tool => !isBuiltInTool(tool.name));

      // Auto-approve built-in tools for a smooth read experience, EXCEPT calls
      // that touch sensitive resources (e.g. Secrets), which are routed through
      // the approval gate as defense-in-depth.
      const autoApprovedBuiltIns = builtInToolsForApproval.filter(
        tool => !isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      const sensitiveBuiltIns = builtInToolsForApproval.filter(tool =>
        isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      approvedToolIds.push(...autoApprovedBuiltIns.map(tool => tool.id));

      // Request approval for MCP tools and sensitive built-in tools.
      const toolsNeedingApproval = [...mcpToolsForApproval, ...sensitiveBuiltIns];
      if (toolsNeedingApproval.length > 0) {
        try {
          const approvedMCPToolIds = await inlineToolApprovalManager.requestApproval(
            toolsNeedingApproval,
            this
          );
          approvedToolIds.push(...approvedMCPToolIds);
        } catch (approvalError) {
          // If user denied the tools and nothing was auto-approved, stop here.
          if (autoApprovedBuiltIns.length === 0) {
            const denialPrompt: ConversationMessage = {
              role: 'assistant',
              content:
                "I understand. I won't execute those tools. Feel free to ask me something else.",
            };
            this.history.push(denialPrompt);
            return denialPrompt;
          }
          // Otherwise continue with only built-in tools
        }
      }

      // Filter approved tools and get their processed arguments
      const approvedTools = filterApprovedOrchestrationTools(recommendedTools, approvedToolIds);

      // Group tools by execution strategy (parallel vs sequential)
      const { parallel, sequential } = ToolPlanner.groupToolsByExecutionStrategy(approvedTools);

      // Execute parallel tools first
      const toolResults: Record<string, ToolResult> = {};
      const toolExecutionIds: Record<string, string> = {};

      if (parallel.length > 0) {
        const parallelPromises = parallel.map(async tool => {
          const approvalData = toolsForApproval.find(t => t.name === tool.name);
          const toolCallId = approvalData?.id || `orchestrated-${tool.name}-${Date.now()}`;
          toolExecutionIds[tool.name] = toolCallId;

          try {
            const result = await this.toolManager.executeTool(
              tool.name,
              approvalData?.arguments || tool.arguments || {}
            );
            toolResults[tool.name] = result;
            return result;
          } catch (error) {
            toolResults[tool.name] = buildOrchestrationToolError(tool.name, error as Error | null);
          }
        });

        try {
          await Promise.all(parallelPromises);
        } catch (error) {
          console.error('Error executing parallel tools:', error);
          // Continue with sequential tools even if some parallel tools fail
        }
      }

      // Execute sequential tools one by one
      for (const tool of sequential) {
        const approvalData = toolsForApproval.find(t => t.name === tool.name);
        const toolCallId = approvalData?.id || `orchestrated-${tool.name}-${Date.now()}`;
        toolExecutionIds[tool.name] = toolCallId;

        try {
          const result = await this.toolManager.executeTool(
            tool.name,
            approvalData?.arguments || tool.arguments || {}
          );
          toolResults[tool.name] = result;
        } catch (error) {
          toolResults[tool.name] = buildOrchestrationToolError(tool.name, error as Error | null);
        }
      }

      // DO NOT add tool results to history - we'll let the LLM response handle rendering
      // This prevents duplicate JSON rendering in the UI
      // The results are kept in memory for the response generation below

      // Use LLM to generate a comprehensive response based on tool results
      // Pass the FULL tool results with all data for the LLM to analyze
      const response = await this.generateResponseFromToolResults(userMessage, toolResults);

      // Clear the tool confirmation message from history after execution completes
      // This ensures the "Executing tools..." loading dialog is hidden
      this.clearToolConfirmation();

      return response;
    } catch (error) {
      // Fall back to regular LLM response
      const errorPrompt = buildMultiToolErrorPrompt(error as Error | null);
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  /**
   * Aggregates multiple tool results for display or model analysis.
   *
   * @param results - Tool results keyed by tool name.
   * @returns Structured result text.
   */
  private aggregateToolResults(results: Record<string, ToolResult>): string {
    return aggregateToolResults(results);
  }

  /**
   * Generate a comprehensive response based on aggregated tool results
   * Now accepts full tool results object to provide complete context to LLM
   *
   * The unbound model receives recent context and fully formatted results. Model
   * failure returns a readable rendering of each raw result.
   *
   * @param userMessage - Original request to answer.
   * @param toolResults - Complete in-memory tool results keyed by name.
   * @returns Synthesized or fallback assistant message added to history.
   */
  private async generateResponseFromToolResults(
    userMessage: string,
    toolResults: Record<string, ToolResult>
  ): Promise<ConversationMessage> {
    try {
      // Use the UNBOUND model to force text output, not more tool calls
      const model = this.model;

      // Format tool results with full data for LLM analysis
      const formattedResults = formatToolResultsForLLM(toolResults);

      const systemPrompt = `You are an AI assistant analyzing tool results and providing helpful responses.

Based on tool data AND the user's original request, generate a comprehensive response.

CRITICAL GUIDELINES:
1. If user asked to LEARN/UNDERSTAND a concept, START with educational explanation before showing data
2. If user asked "teach me about X", explain the concept clearly with examples
3. Analyze and discuss ACTUAL data from tools - reference specific values
4. Synthesize information to provide a complete picture
5. Use formatting (lists, sections) for readability
6. Explain what data means and why it matters
7. Provide actionable next steps
8. NEVER just show raw data tables - always add context and explanation

Examples:
- "teach me about ingress" → Explain what ingress is, how it works, THEN show their resources with context
- "show me pods" → Present pod data with status summary and insights
- "what is a deployment" → Explain deployment concept (don't need tool data for this)`;

      const userPrompt = `Original user request: "${userMessage}"

Tool Results:
${formattedResults}

Please analyze this data and provide a specific, detailed response that directly addresses the user's request using the information provided above. Reference specific findings from the results.`;

      const messages = [
        new SystemMessage(systemPrompt),
        ...this.prepareChatHistory().slice(-4), // Include recent context
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages, {
        signal: this.currentAbortController?.signal,
      });

      this.currentAbortController = null;

      const assistantPrompt: ConversationMessage = {
        role: 'assistant',
        content: this.extractTextContent(response.content),
      };

      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error('Error generating response from tool results:', error);

      const fallbackPrompt: ConversationMessage = {
        role: 'assistant',
        content: `I executed the requested tools and gathered information. There was an error generating a comprehensive summary, but here are the raw results:\n\n${Object.entries(
          toolResults
        )
          .map(([name, result]) => {
            // Extract the meaningful content from a ToolResponse object rather than
            // serialising internal fields (shouldAddToHistory, shouldProcessFollowUp…)
            // that users should never see.
            const display = redactSecrets(
              result && typeof result === 'object' && typeof result.content === 'string'
                ? result.content
                : JSON.stringify(result, null, 2)
            );
            return `**${name}**: ${display}`;
          })
          .join('\n\n')}`,
      };

      this.history.push(fallbackPrompt);
      return fallbackPrompt;
    }
  }

  /**
   * Normalizes, filters, enhances, approves, and executes model tool calls.
   *
   * Built-in tools are auto-approved; MCP tools use inline approval. Denied or
   * failed approval paths add aligned tool-result errors before optional follow-up.
   *
   * @param response - Model content and untrusted tool calls.
   * @returns Assistant message or generated follow-up after tool execution.
   */
  private async handleToolCalls(response: ModelToolResponse): Promise<ConversationMessage> {
    const enabledToolIds = [...this.toolManager.getToolNames(), ...this.extraTools.keys()];

    // If no tools are enabled but LLM is returning tool calls, this indicates a bug
    if (enabledToolIds.length === 0) {
      // Treat as regular response since no tools should be available
      const assistantPrompt: ConversationMessage = {
        role: 'assistant',
        content:
          this.extractTextContent(response.content) ||
          'I apologize, but I cannot use tools as they have been disabled in your settings.',
      };
      this.history.push(assistantPrompt);

      // Clear progress steps when all tools are disabled

      return assistantPrompt;
    }

    // Filter out disabled tools from tool calls
    const allToolCalls = normalizeLLMToolCalls(response.tool_calls ?? []);
    const { enabled: toolCalls, disabled: filteredOutTools } = filterToolCallsByEnabled(
      allToolCalls,
      enabledToolIds
    );

    const assistantPrompt: ConversationMessage = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
      toolCalls: toolCalls,
    };
    this.history.push(assistantPrompt);

    // If all tool calls were filtered out (all requested tools are disabled), handle gracefully
    if (toolCalls.length === 0) {
      // Add informational message about disabled tools if any were filtered
      if (filteredOutTools.length > 0) {
        const disabledToolNames = filteredOutTools.map(tc => tc.function.name);

        // Replace the AI's response with a clear explanation instead of calling tools again
        const clarifiedResponse = buildDisabledToolsMessage(disabledToolNames);

        // Update the assistant prompt in history with the clarified response
        const updatedPrompt: ConversationMessage = {
          role: 'assistant',
          content: clarifiedResponse,
        };

        // Replace the last history entry with the updated prompt
        this.history[this.history.length - 1] = updatedPrompt;

        // Clear progress steps when tools are disabled

        return updatedPrompt;
      }

      // Clear progress steps when no tools to execute

      return assistantPrompt;
    }

    // Prepare tool calls for approval with intelligent argument processing
    const toolCallsForApproval: ToolCall[] = await Promise.all(
      toolCalls.map(async tc => {
        const toolName = tc.function.name;
        const mcpTools = this.toolManager.getMCPTools();
        const isMCPTool = mcpTools.some(tool => tool.name === toolName);
        let processedArguments = parseSerializedToolArguments(tc.function.arguments);

        // Use AI to enhance arguments for MCP tools
        if (isMCPTool) {
          try {
            const toolSchema = await MCPArgumentProcessor.getToolSchema(toolName);
            if (toolSchema) {
              // Build user context from current conversation
              const userContext = this.buildUserContext();

              // Store original arguments for comparison
              const originalArguments = { ...processedArguments };

              // Use AI to intelligently prepare arguments
              processedArguments = await this.enhanceArgumentsWithAI(
                toolName,
                toolSchema,
                userContext,
                processedArguments
              );

              // Mark which fields were enhanced by LLM for UI display
              processedArguments._llmEnhanced = {
                enhanced: true,
                originalArgs: originalArguments,
                enhancedFields: identifyEnhancedFields(originalArguments, processedArguments),
              };
            }
          } catch (error) {
            console.warn(`Failed to enhance arguments for ${toolName}:`, error);
            // Fall back to original arguments
          }
        }

        return {
          id: tc.id,
          name: toolName,
          description: this.getToolDescription(toolName, isMCPTool),
          arguments: processedArguments,
          type: isMCPTool ? 'mcp' : 'regular',
        };
      })
    );

    try {
      // Separate built-in tools from MCP tools
      const builtInTools = toolCallsForApproval.filter(tool => isBuiltInTool(tool.name));
      const mcpTools = toolCallsForApproval.filter(tool => !isBuiltInTool(tool.name));

      const approvedToolIds: string[] = [];

      // Auto-approve built-in tools, except sensitive ones (e.g. Secret access),
      // which are routed through the approval gate as defense-in-depth.
      const autoApprovedBuiltIns = builtInTools.filter(
        tool => !isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      const sensitiveBuiltIns = builtInTools.filter(tool =>
        isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      approvedToolIds.push(...autoApprovedBuiltIns.map(tool => tool.id));

      // Request approval for MCP tools and sensitive built-in tools.
      const toolsNeedingApproval = [...mcpTools, ...sensitiveBuiltIns];
      if (toolsNeedingApproval.length > 0) {
        const approvedMCPToolIds = await inlineToolApprovalManager.requestApproval(
          toolsNeedingApproval,
          this // Pass the AI manager instance
        );
        approvedToolIds.push(...approvedMCPToolIds);
      }

      // Filter tool calls to only execute approved ones and update with processed arguments
      const approvedToolCalls = mergeApprovedArguments(
        toolCalls,
        toolCallsForApproval.map(a => ({
          id: a.id,
          arguments: a.arguments as Record<string, unknown>,
        })),
        approvedToolIds
      );
      const deniedToolCalls = toolCalls.filter(tc => !approvedToolIds.includes(tc.id));

      // Add denied tool responses to history
      for (const deniedTool of deniedToolCalls) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: 'Tool execution denied by user',
            userFriendlyMessage: `The execution of ${deniedTool.function.name} was denied by the user.`,
          }),
          toolCallId: deniedTool.id,
          name: deniedTool.function.name,
        });
      }

      // Process approved tool calls
      if (approvedToolCalls.length > 0) {
        await this.processToolCalls(approvedToolCalls, assistantPrompt);
      }
    } catch (error) {
      // Add denial responses for all tools
      for (const toolCall of toolCalls) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: (error as Error).message || 'Tool execution denied',
            userFriendlyMessage: `Tool execution was denied: ${
              (error as Error).message || 'User chose not to proceed'
            }`,
          }),
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        });
      }
    }

    // Check if we should process follow-up
    const toolResponses = this.history.filter(
      prompt => prompt.role === 'tool' && toolCalls.some(tc => tc.id === prompt.toolCallId)
    );

    if (shouldProcessToolFollowUp(toolResponses)) {
      return await this.processToolResponses();
    }

    // Clear progress steps when not processing follow-up

    return assistantPrompt;
  }

  /**
   * Handle tool calls for streaming scenario - executes tools without generating response
   * (response will be streamed separately by processToolResponsesStream)
   *
   * @param toolCalls - Untrusted streamed tool calls to normalize.
   * @param assistantPrompt - Assistant message that declared the calls.
   * @returns No value after approved execution and aligned denial responses.
   */
  private async handleToolCallsForStreaming(
    toolCalls: unknown[],
    assistantPrompt: ConversationMessage
  ): Promise<void> {
    const enabledToolIds = this.toolManager.getToolNames();

    // Convert tool calls to expected format using shared normalizer
    const formattedToolCalls = normalizeLLMToolCalls(toolCalls);

    // Filter out disabled tools
    const { enabled: enabledToolCalls } = filterToolCallsByEnabled(
      formattedToolCalls,
      enabledToolIds
    );

    // Prepare tool calls for approval
    const toolCallsForApproval: ToolCall[] = await Promise.all(
      enabledToolCalls.map(async tc => {
        const toolName = tc.function.name;
        const mcpTools = this.toolManager.getMCPTools();
        const isMCPTool = mcpTools.some(tool => tool.name === toolName);
        let processedArguments = parseSerializedToolArguments(tc.function.arguments);

        // Use AI to enhance arguments for MCP tools
        if (isMCPTool) {
          try {
            const toolSchema = await MCPArgumentProcessor.getToolSchema(toolName);
            if (toolSchema) {
              const userContext = this.buildUserContext();
              const originalArguments = { ...processedArguments };

              processedArguments = await this.enhanceArgumentsWithAI(
                toolName,
                toolSchema,
                userContext,
                processedArguments
              );

              processedArguments._llmEnhanced = {
                enhanced: true,
                originalArgs: originalArguments,
                enhancedFields: identifyEnhancedFields(originalArguments, processedArguments),
              };
            }
          } catch (error) {
            console.warn(`Failed to enhance arguments for ${toolName}:`, error);
          }
        }

        return {
          id: tc.id,
          name: toolName,
          description: this.getToolDescription(toolName, isMCPTool),
          arguments: processedArguments,
          type: isMCPTool ? 'mcp' : 'regular',
        };
      })
    );

    try {
      // Separate built-in tools from MCP tools
      const builtInTools = toolCallsForApproval.filter(tool => isBuiltInTool(tool.name));
      const mcpTools = toolCallsForApproval.filter(tool => !isBuiltInTool(tool.name));

      const approvedToolIds: string[] = [];

      // Auto-approve built-in tools, except sensitive ones (e.g. Secret access),
      // which are routed through the approval gate as defense-in-depth.
      const autoApprovedBuiltIns = builtInTools.filter(
        tool => !isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      const sensitiveBuiltIns = builtInTools.filter(tool =>
        isSensitiveBuiltInToolCall(tool.name, tool.arguments)
      );
      approvedToolIds.push(...autoApprovedBuiltIns.map(tool => tool.id));

      // Request approval for MCP tools and sensitive built-in tools.
      const toolsNeedingApproval = [...mcpTools, ...sensitiveBuiltIns];
      if (toolsNeedingApproval.length > 0) {
        const approvedMCPToolIds = await inlineToolApprovalManager.requestApproval(
          toolsNeedingApproval,
          this
        );
        approvedToolIds.push(...approvedMCPToolIds);
      }

      // Filter approved tool calls
      const approvedToolCalls = mergeApprovedArguments(
        enabledToolCalls,
        toolCallsForApproval.map(a => ({
          id: a.id,
          arguments: a.arguments as Record<string, unknown>,
        })),
        approvedToolIds
      );

      // Execute approved tools (this is fast - 7-14ms per tool)
      if (approvedToolCalls.length > 0) {
        await this.processToolCalls(approvedToolCalls, assistantPrompt);
      }

      // Add denied tool responses to history
      const deniedToolCalls = enabledToolCalls.filter(tc => !approvedToolIds.includes(tc.id));
      for (const deniedTool of deniedToolCalls) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: 'Tool execution denied by user',
            userFriendlyMessage: `The execution of ${deniedTool.function.name} was denied by the user.`,
          }),
          toolCallId: deniedTool.id,
          name: deniedTool.function.name,
        });
      }
    } catch (error) {
      // Add denial responses for all tools
      for (const toolCall of enabledToolCalls) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: (error as Error).message || 'Tool execution denied',
            userFriendlyMessage: `Tool execution was denied: ${
              (error as Error).message || 'User chose not to proceed'
            }`,
          }),
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        });
      }
    }
  }

  /**
   * Executes normalized calls sequentially and appends aligned tool responses.
   *
   * Externally supplied tools take precedence over the runtime. Display-only
   * placeholders preserve strict tool-call alignment when results are withheld.
   * Failures also append a system error summary.
   *
   * @param toolCalls - Normalized approved tool calls.
   * @param assistantPrompt - Assistant message that initiated the calls.
   * @returns No value after history is updated.
   */
  private async processToolCalls(
    toolCalls: NormalizedToolCall[],
    assistantPrompt: ConversationMessage
  ): Promise<void> {
    const failedOperations: string[] = [];

    for (const toolCall of toolCalls) {
      const args = parseSerializedToolArguments(toolCall.function.arguments);

      try {
        // Try extra tools first (e.g. kubectl for CLI), then the tool runtime.
        const extraTool = this.extraTools.get(toolCall.function.name);
        let toolResponse;

        if (extraTool) {
          // Execute the extra LangChain tool directly
          const result = await extraTool.invoke(args);
          const content = typeof result === 'string' ? result : JSON.stringify(result);
          toolResponse = {
            content,
            shouldAddToHistory: true,
            shouldProcessFollowUp: true,
          };
        } else {
          // Execute the tool call using the tool runtime.
          toolResponse = await this.toolManager.executeTool(
            toolCall.function.name,
            args,
            toolCall.id,
            assistantPrompt
          );
        }

        // Check if the response indicates an error even if the tool didn't throw
        const { isError, errorMsg } = detectToolResponseError(toolResponse.content);
        if (isError) {
          const toolName = toolCall.function.name || 'unknown tool';
          failedOperations.push(`${toolName}: ${errorMsg}`);
        }

        // Only add to history if the tool response indicates we should
        if (toolResponse.shouldAddToHistory) {
          this.history.push({
            role: 'tool',
            content: redactSecrets(toolResponse.content),
            toolCallId: toolCall.id,
            name: toolCall.function.name,
          });
        } else if (toolResponse.metadata?.requiresConfirmation) {
          // For confirmation-based operations (PUT/PATCH/DELETE), add a minimal placeholder
          // so that validateToolCallAlignment doesn't inject fake error messages.
          this.history.push({
            role: 'tool',
            content: buildConfirmationPlaceholderJson(
              typeof toolResponse.metadata?.method === 'string'
                ? toolResponse.metadata.method
                : undefined
            ),
            toolCallId: toolCall.id,
            name: toolCall.function.name,
            isDisplayOnly: true, // Don't send to LLM or display in UI
          });
        } else {
          // Fallback: tool said not to add to history and isn't awaiting
          // confirmation, but we still need a placeholder to maintain
          // tool_call / tool_result alignment so Anthropic and other
          // strict providers don't reject the subsequent request.
          this.history.push({
            role: 'tool',
            content: JSON.stringify({
              status: 'completed',
              shouldProcessFollowUp: toolResponse.shouldProcessFollowUp ?? false,
            }),
            toolCallId: toolCall.id,
            name: toolCall.function.name,
            isDisplayOnly: true,
          });
        }
      } catch (error) {
        console.error('Error executing tool call:', error);

        const toolName = toolCall.function.name || 'unknown tool';
        const errorMessage = (error as Error | null)?.message || 'Unknown error occurred';
        failedOperations.push(`${toolName}: ${errorMessage}`);

        // Always add error responses to maintain alignment
        this.history.push({
          role: 'tool',
          content: redactSecrets(buildToolExecutionErrorJson(toolName, errorMessage, args)),
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        });
      }
    }

    // If there were any failed operations, use the specialized template to ensure the AI addresses them properly
    if (failedOperations.length > 0) {
      try {
        // Use the tool failure template to generate clear error communication
        const toolErrorPrompt = await toolFailurePromptTemplate.format({
          failedOperations: failedOperations.join('\n'),
          context: 'Tool execution during user request',
        });

        const errorSystemMessage = {
          role: 'system' as const,
          content: toolErrorPrompt,
          toolCallId: 'system-error-alert',
          name: 'error_handler',
        };

        this.history.push(errorSystemMessage);

        console.warn('Tool execution failures detected:', failedOperations);
      } catch (templateError) {
        console.error('Error using tool failure template:', templateError);

        // Fallback to basic error message
        const errorSystemMessage = {
          role: 'system' as const,
          content: buildFailedOperationsFallback(failedOperations),
          toolCallId: 'system-error-alert',
          name: 'error_handler',
        };

        this.history.push(errorSystemMessage);
        console.warn('Tool execution failures detected:', failedOperations);
      }
    }
  }

  /**
   * Converts request failures into assistant messages.
   *
   * Abort errors become cancellation messages. API errors first attempt a
   * model-generated explanation and otherwise use the standard friendly error.
   *
   * @param error - Request failure of any shape.
   * @returns Error message added to history.
   */
  private async handleUserSendError(error: unknown): Promise<ConversationMessage> {
    // Clear abort controller in case of error
    this.currentAbortController = null;

    console.error('Error in userSend:', error);

    // Handle abort errors
    const errorName =
      typeof error === 'object' && error !== null && 'name' in error ? error.name : undefined;
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : '';
    if (errorName === 'AbortError' || /abort/i.test(errorMessage)) {
      const errorPrompt: ConversationMessage = {
        role: 'assistant',
        content: 'Request cancelled.',
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }

    // For API-related errors, use specialized error template to ensure visibility
    if (isApiRelatedError(error)) {
      try {
        // Use the API error template to generate a clear, visible error response
        const errorTemplatePrompt = await apiErrorPromptTemplate.format({
          method: 'unknown',
          url: 'unknown',
          errorMessage: toUserFriendlyError(error),
          errorDetails: error instanceof Error ? error.message : String(error),
          context: 'API request processing',
        });

        // Generate a user-friendly response using the AI model
        const errorResponse = await this.model.invoke([
          { role: 'system', content: errorTemplatePrompt },
          { role: 'user', content: 'Please explain this error clearly and suggest next steps.' },
        ]);

        const errorText = this.extractTextContent(errorResponse);

        const apiErrorPrompt: ConversationMessage = {
          role: 'assistant',
          content: errorText,
          error: true,
        };

        this.history.push(apiErrorPrompt);
        return apiErrorPrompt;
      } catch (templateError) {
        console.error('Error using API error template:', templateError);
        // Fall through to standard error handling
      }
    }

    // Standard error handling for non-API errors
    const errorPrompt: ConversationMessage = {
      role: 'assistant',
      content: `Sorry, there was an error processing your request: ${toUserFriendlyError(error)}`,
      error: true,
    };
    this.history.push(errorPrompt);
    return errorPrompt;
  }

  /**
   * Generates the assistant's follow-up response from completed tool outputs.
   *
   * @returns Last assistant message when no tool results exist, otherwise summarized or error output.
   */
  public async processToolResponses(): Promise<ConversationMessage> {
    // Check if there are any tool responses in the history
    if (!hasToolResponses(this.history)) {
      return getLastAssistantMessage(this.history);
    }

    // Validate tool call/response alignment
    this.validateToolCallAlignment();

    try {
      // Prepare messages using a more structured approach
      const messages = this.prepareMessagesForToolResponse();

      // Create a chain for tool response processing
      const chain = this.createToolResponseChain();

      // Process the response
      const response = await chain.invoke({
        messages: messages.slice(1), // Exclude system message for the chain
        systemPrompt: this.createToolResponseSystemPrompt(), // Use specialized prompt for tool responses
      });

      return this.handleToolResponseResult(response);
    } catch (error) {
      return this.handleToolResponseError(error);
    }
  }

  /**
   * Streaming version of processToolResponses for better perceived performance
   * Yields content as it's generated by the model after tool execution
   *
   * @returns Generator yielding summary chunks and returning the final assistant or error message.
   */
  public async *processToolResponsesStream(): AsyncGenerator<
    string,
    ConversationMessage,
    undefined
  > {
    // Check if there are any tool responses in the history
    if (!hasToolResponses(this.history)) {
      const lastMessage = getLastAssistantMessage(this.history);
      yield lastMessage.content;
      return lastMessage;
    }

    // Validate tool call/response alignment
    this.validateToolCallAlignment();

    try {
      // Prepare messages for tool response
      const systemMessage = new SystemMessage(this.createToolResponseSystemPrompt());
      const messages = this.prepareMessagesForToolResponse();

      // Use the unbound model (no tools) to avoid recursive tool calls
      const model = this.model;

      // Build final message array
      const finalMessages = [systemMessage, ...messages.slice(1)];

      // Stream the response
      const stream = await model.stream(finalMessages, {
        signal: this.currentAbortController?.signal,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const content = this.extractTextContent(chunk.content);
        if (content) {
          fullContent += content;
          yield content;
        }
      }

      // Create the complete response prompt
      const assistantPrompt: ConversationMessage = {
        role: 'assistant',
        content: fullContent,
      };

      this.history.push(assistantPrompt);

      // Clear progress steps after streaming response

      return assistantPrompt;
    } catch (error) {
      const errorPrompt = this.handleToolResponseError(error);
      yield errorPrompt.content;

      // Clear progress steps even on error

      return errorPrompt;
    }
  }

  /**
   * Creates an unbound-model invoker for tool-response summaries.
   *
   * @returns Object that invokes the model with one system message and supplied messages.
   */
  private createToolResponseChain() {
    //TODO: not sure which we should use now...

    // // Use the bound model (with tools) so the LLM can make follow-up tool calls
    // // (e.g., fetching logs after retrieving pod details).
    // const modelToUse = this.boundModel || this.model;

    // Use the UNBOUND model (no tools) to force the LLM to produce a text summary
    // instead of making additional tool calls
    const model = this.model;

    return {
      /**
       * Invokes the unbound model for a tool-response summary.
       *
       * @param input - Specialized system prompt and analysis messages.
       * @returns Raw model response.
       */
      invoke: (input: ToolResponseChainInput) =>
        model.invoke([new SystemMessage(input.systemPrompt), ...input.messages]),
    };
  }

  /**
   * Logs mismatched tool-call and tool-response identifiers.
   *
   * @returns No value.
   */
  private validateToolCallAlignment(): void {
    const result = validateToolCallAlignment(this.history);
    if (!result.aligned) {
      console.error('Tool call/response mismatch detected', {
        expectedIds: result.expectedIds,
        actualResponses: result.actualIds,
      });
    }
  }

  /**
   * Prepares regular conversation and bounded tool data for response analysis.
   *
   * Tool content is accumulated up to 500,000 JavaScript string characters.
   *
   * @returns System, regular conversation, and optional tool-analysis messages.
   */
  private prepareMessagesForToolResponse(): BaseMessage[] {
    const systemMessage = new SystemMessage(this.createSystemPrompt());
    const messages: BaseMessage[] = [systemMessage];

    // Add conversation history, excluding tool responses and assistant tool-call messages.
    // Tool responses are collected separately and added as context for the LLM to analyze.
    for (const prompt of this.history) {
      if (!isRegularConversationMessage(prompt)) continue;
      messages.push(...convertPromptsToMessages([prompt]));
    }

    // Collect tool response data and present it to the LLM as context to analyze
    const toolResponses = this.history.filter(
      p => p.role === 'tool' && p.toolCallId && !p.isDisplayOnly
    );
    if (toolResponses.length > 0) {
      let totalResponseSize = 0;
      const MAX_RESPONSE_SIZE = 500000; // JavaScript string characters

      const toolDataParts: string[] = [];
      for (const p of toolResponses) {
        const processed = this.processToolContent(p, totalResponseSize, MAX_RESPONSE_SIZE);
        if (processed) {
          totalResponseSize += processed.length;
          toolDataParts.push(processed);
        }
      }

      const toolData = toolDataParts.join('\n\n');
      if (toolData) {
        messages.push(new HumanMessage(buildToolDataAnalysisRequest(toolData)));
      }
    }

    return messages;
  }

  /**
   * Processes one tool response within a cumulative character limit.
   *
   * Invalid content is replaced with an error JSON string rather than `null`.
   *
   * @param prompt - Tool response message.
   * @param currentSize - Accumulated JavaScript string characters.
   * @param maxSize - Maximum cumulative JavaScript string characters.
   * @returns Processed text, or error JSON whenever the shared helper returns `null`.
   */
  private processToolContent(
    prompt: ConversationMessage,
    currentSize: number,
    maxSize: number
  ): string | null {
    const result = processToolContent(prompt.content, currentSize, maxSize);
    if (!result) {
      console.warn(`Invalid tool response format for ${prompt.toolCallId}`, prompt);
      return JSON.stringify({ error: true, message: 'Invalid tool response format' });
    }
    return result.text;
  }

  /**
   * Finds the latest assistant tool-call message in history.
   *
   * @returns History index, or `-1` when absent.
   */
  private findLastAssistantWithTools(): number {
    return findLastAssistantWithTools(this.history);
  }

  // Retained response-depth state; follow-up recursion is currently disabled.
  private toolResponseDepth = 0;
  private static readonly MAX_TOOL_RESPONSE_DEPTH = 5;

  /**
   * Converts a tool-response model result into final assistant history.
   *
   * Kubectl suggestions are corrected. Empty content accompanied by new tool
   * calls is replaced with recent tool output instead of recursively executing.
   * History is truncated to the last assistant tool-call message before final output.
   *
   * @param response - Tool-response model result.
   * @returns Corrected, formatted-output, fallback, or standard assistant message.
   */
  private async handleToolResponseResult(
    response: ModelToolResponse
  ): Promise<ConversationMessage> {
    // Analyze and potentially correct kubectl suggestions
    const correctedResponse = await this.analyzeAndCorrectResponse(response);

    const extractedContent = this.extractTextContent(correctedResponse.content);

    // If the model returned empty content but has tool calls, it's trying to call more tools
    // Instead of allowing this, we should provide a fallback response based on the tool results
    if (isEmptyLLMContent(extractedContent) && (response.tool_calls?.length ?? 0) > 0) {
      // Get the most recent tool responses from history
      const recentToolResponses = getRecentToolResponses(this.history);

      // Create a fallback response based on tool results
      // For MCP tools with formatted output, return them directly without prefix
      if (recentToolResponses.length === 1) {
        const singleResponse = recentToolResponses[0];
        if (isMCPFormattedOutput(singleResponse.content)) {
          const assistantPrompt: ConversationMessage = {
            role: 'assistant',
            content: singleResponse.content,
            toolCalls: [],
          };

          const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();
          if (lastAssistantWithToolsIndex >= 0) {
            this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
          }

          this.history.push(assistantPrompt);
          return assistantPrompt;
        }
      }

      // Standard fallback for multiple tools or non-MCP tools
      const fallbackContent = assembleFallbackResponseContent(recentToolResponses);

      const assistantPrompt: ConversationMessage = {
        role: 'assistant',
        content: fallbackContent.trim(),
        toolCalls: [], // Don't include additional tool calls
      };

      // Clean up history to prevent message order issues
      const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();
      if (lastAssistantWithToolsIndex >= 0) {
        this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
      }

      this.history.push(assistantPrompt);
      return assistantPrompt;
    }

    const assistantPrompt: ConversationMessage = {
      role: 'assistant',
      content: extractedContent,
      toolCalls: correctedResponse.tool_calls?.length
        ? mapCorrectedResponseToolCalls(correctedResponse.tool_calls)
        : [],
    };

    // Clean up history to prevent message order issues
    const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();
    if (lastAssistantWithToolsIndex >= 0) {
      this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
    }

    this.history.push(assistantPrompt);
    this.toolResponseDepth = 0; // Reset depth on final text response
    return assistantPrompt;
  }

  /**
   * Corrects model text that suggests kubectl or command-line use.
   *
   * @param response - Model response to inspect.
   * @returns Original response or a corrected model response.
   */
  private async analyzeAndCorrectResponse(response: ModelToolResponse): Promise<ModelToolResponse> {
    const responseContent = extractTextContent(response.content);
    if (responseContent && containsKubectlSuggestion(responseContent)) {
      return await this.getCorrectedResponse(response);
    }
    return response;
  }

  /**
   * Requests an unbound-model revision for a kubectl suggestion.
   *
   * A reminder is appended to history even when correction fails.
   *
   * @param originalResponse - Response retained as the failure fallback.
   * @returns Corrected response, or the original response on model failure.
   */
  private async getCorrectedResponse(
    originalResponse: ModelToolResponse
  ): Promise<ModelToolResponse> {
    this.history.push({
      role: 'system',
      content:
        'REMINDER: Never suggest kubectl or command line tools. Always use the kubernetes_api_request tool or explain UI actions. The user is using a web dashboard and cannot access the command line.',
    });

    try {
      // Use unbound model to produce text correction
      const correctionPrompt = new SystemMessage(
        'Your last response suggested using kubectl or command line, which is not available to the user. Please revise your response to use the kubernetes_api_request tool instead.'
      );

      const messages = [correctionPrompt];
      const correctedResponse = await this.model.invoke(messages);
      return correctedResponse;
    } catch (error) {
      console.error('Error getting corrected response:', error);
      return originalResponse; // Return original if correction fails
    }
  }

  /**
   * Converts a tool-response processing error into an assistant message.
   *
   * @param error - Error, string, object, or nullish failure value.
   * @returns Error assistant message appended to history.
   */
  private handleToolResponseError(error: unknown): ConversationMessage {
    console.error('Error during tool response processing:', error);

    // Safely extract an error message regardless of whether `error` is an
    // Error object, a plain string, null, or undefined.
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unknown error';

    const errorPrompt: ConversationMessage = {
      role: 'assistant',
      content: `Sorry, there was an error processing the tool responses: ${message}`,
      error: true,
    };

    this.history.push(errorPrompt);
    return errorPrompt;
  }

  /**
   * Enhances tool arguments with model suggestions and required-field defaults.
   *
   * The input is shallow-copied, model suggestions overwrite original fields,
   * and missing required fields are filled last.
   *
   * @param toolName - MCP tool name.
   * @param toolSchema - Tool input schema.
   * @param userContext - Conversation and environment context.
   * @param originalArgs - Original arguments to preserve and enhance.
   * @returns New enhanced argument map.
   */
  private async enhanceArgumentsWithAI(
    toolName: string,
    toolSchema: MCPToolSchema,
    userContext: UserContext,
    originalArgs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const enhanced = { ...originalArgs };

    if (!toolSchema.inputSchema?.properties) {
      return enhanced;
    }

    try {
      // Use LLM to intelligently prepare arguments based on user context and tool schema
      const llmEnhancedArgs = await this.prepareLLMArguments(
        toolName,
        toolSchema,
        userContext,
        originalArgs
      );

      // Merge LLM suggestions with original arguments, preferring LLM suggestions
      Object.assign(enhanced, llmEnhancedArgs);
    } catch (error) {
      console.warn(`Failed to get LLM enhancement for ${toolName}:`, error);
    }

    // Always fill any required fields that are still missing after LLM
    // enhancement.  This handles two cases:
    //   1. The LLM returned non-JSON (prepareLLMArguments returns {})
    //   2. The LLM model call threw and prepareLLMArguments caught it → {}
    // Without this, required fields are silently left empty because
    // prepareLLMArguments never re-throws, so the catch block above is dead
    // code for LLM failures.
    Object.assign(
      enhanced,
      fillMissingRequiredFields(enhanced, toolSchema.inputSchema, userContext)
    );

    return enhanced;
  }

  /**
   * Uses the unbound model to propose context-aware tool arguments.
   *
   * @param toolName - MCP tool name.
   * @param toolSchema - Tool input schema.
   * @param userContext - Conversation and environment context.
   * @param originalArgs - Existing arguments included in the prompt.
   * @returns Parsed argument object, or an empty object on invocation or parsing failure.
   */
  private async prepareLLMArguments(
    toolName: string,
    toolSchema: MCPToolSchema,
    userContext: UserContext,
    originalArgs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Build prompt for argument preparation
    const argumentPreparationPrompt = this.createArgumentPreparationPrompt(
      toolName,
      toolSchema,
      userContext,
      originalArgs
    );

    try {
      // Use the existing model instance but without tools to avoid recursive tool calls
      const response = await this.model.invoke([
        { role: 'system', content: argumentPreparationPrompt.system },
        { role: 'user', content: argumentPreparationPrompt.user },
      ]);

      // Parse the LLM response to extract arguments
      const responseText = this.extractTextContent(response.content);
      const parsedArgs = parseArgumentsFromResponse(responseText);

      return parsedArgs;
    } catch (error) {
      console.warn('Failed to prepare arguments with LLM:', error);
      return {};
    }
  }

  /**
   * Creates system and user prompts for argument preparation.
   *
   * @param toolName - MCP tool name.
   * @param toolSchema - Tool input schema.
   * @param userContext - Conversation and environment context.
   * @param originalArgs - Existing arguments.
   * @returns Argument-preparation prompt pair.
   */
  private createArgumentPreparationPrompt(
    toolName: string,
    toolSchema: MCPToolSchema,
    userContext: UserContext,
    originalArgs: Record<string, unknown>
  ): {
    /** System instructions for argument generation. */
    system: string;
    /** User prompt containing schema, context, and original arguments. */
    user: string;
  } {
    return createArgumentPreparationPrompt(toolName, toolSchema, userContext, originalArgs);
  }

  // Create a description of the tool schema

  /**
   * Gets one context-aware default from the shared prompt helper.
   *
   * @param fieldName - Input field name.
   * @param fieldSchema - Field schema used for type and semantic hints.
   * @param userContext - Conversation and environment context.
   * @returns Suggested value, or `undefined` when no default applies.
   */
  private getIntelligentDefault(
    fieldName: string,
    fieldSchema: Parameters<typeof getIntelligentDefault>[1],
    userContext: UserContext
  ): unknown {
    return getIntelligentDefault(fieldName, fieldSchema, userContext);
  }
}
