import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  FunctionMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOllama } from '@langchain/ollama';
import { AzureChatOpenAI, ChatOpenAI } from '@langchain/openai';
import sanitizeHtml from 'sanitize-html';
import AIManager, { Prompt } from '../ai/manager';
import { basePrompt } from '../ai/prompts';
import { MCPArgumentProcessor, UserContext } from '../components/mcpOutput/MCPArgumentProcessor';
import { inlineToolApprovalManager } from '../utils/InlineToolApprovalManager';
import { ToolCall } from '../utils/ToolApprovalManager';
import { isBuiltInTool } from '../utils/ToolConfigManager';
import { apiErrorPromptTemplate, toolFailurePromptTemplate } from './PromptTemplates';
import { KubernetesToolContext, ToolManager } from './tools';

export default class LangChainManager extends AIManager {
  private model: BaseChatModel;
  private boundModel: BaseChatModel | null = null;
  private providerId: string;
  private toolManager: ToolManager;
  private currentAbortController: AbortController | null = null;
  private promptTemplate: ChatPromptTemplate;
  private outputParser: StringOutputParser;
  private useDirectToolCalling: boolean = false;

  constructor(providerId: string, config: Record<string, any>, enabledTools?: string[]) {
    super();
    this.providerId = providerId;
    const enabledToolIds = enabledTools ?? [];
    console.log(
      'AI Assistant: Initializing with enabled tools:',
      enabledToolIds || 'all tools enabled'
    );
    this.toolManager = new ToolManager(undefined, enabledToolIds); // Only enabled tools
    this.model = this.createModel(providerId, config);

    // Initialize prompt template and output parser
    this.promptTemplate = this.createPromptTemplate();
    this.outputParser = new StringOutputParser();

    // Set up event listeners for inline tool confirmations
    this.setupToolConfirmationListeners();
  }

  // Set up event listeners for tool confirmation events
  private setupToolConfirmationListeners() {
    inlineToolApprovalManager.on('request-confirmation', (data: any) => {
      // Add the tool confirmation message to chat history
      console.log('🔔 LangChainManager: Adding tool confirmation message to history', data);
      this.addToolConfirmationMessage('', data.toolConfirmation);
      console.log(
        '📝 LangChainManager: History length after adding confirmation:',
        this.history.length
      );
    });

    inlineToolApprovalManager.on('update-confirmation', (data: any) => {
      // Update the specific tool confirmation message with new state (e.g., loading)
      console.log(
        '🔄 Tool confirmation update:',
        data.requestId,
        'loading:',
        data.toolConfirmation.loading
      );
      this.updateToolConfirmationMessage(data.requestId, data.toolConfirmation);
    });
  }

  // Helper method to extract text content from different response formats
  private extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    // Handle Gemini's array format: [{ type: 'text', text: '...' }, ...]
    if (Array.isArray(content)) {
      return content
        .filter(item => item && typeof item === 'object' && item.type === 'text')
        .map(item => item.text || '')
        .join('');
    }

    // Handle object format with text property
    if (content && typeof content === 'object') {
      if (content.text) {
        return content.text;
      }
      if (content.content) {
        return this.extractTextContent(content.content);
      }
    }

    // Fallback: try to stringify
    try {
      return String(content || '');
    } catch (error) {
      console.warn('Error extracting text content:', error);
      return '';
    }
  }

  // Method to abort current request
  abort() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  // Create a reusable prompt template
  private createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system', '{systemPrompt}'],
      new MessagesPlaceholder('chatHistory'),
      ['human', '{input}'],
    ]);
  }

  // Create a simple chain for basic responses
  private createBasicChain() {
    const modelToUse = this.boundModel || this.model;
    return this.promptTemplate.pipe(modelToUse).pipe(this.outputParser);
  }

  private createModel(providerId: string, config: Record<string, any>): BaseChatModel {
    try {
      switch (providerId) {
        case 'openai':
          if (!config.apiKey) {
            throw new Error('API key is required for OpenAI');
          }
          return new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        case 'azure':
          if (!config.apiKey || !config.endpoint || !config.deploymentName) {
            throw new Error('Incomplete Azure OpenAI configuration');
          }
          return new AzureChatOpenAI({
            azureOpenAIEndpoint: config.endpoint.replace(/\/+\$/, ''),
            azureOpenAIApiKey: config.apiKey,
            azureOpenAIApiDeploymentName: config.deploymentName,
            azureOpenAIApiVersion: '2024-12-01-preview',
            modelName: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        case 'anthropic':
          if (!config.apiKey) {
            throw new Error('API key is required for Anthropic');
          }
          return new ChatAnthropic({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        case 'mistral':
          if (!config.apiKey) {
            throw new Error('API key is required for Mistral AI');
          }
          return new ChatMistralAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        case 'gemini': {
          if (!config.apiKey) {
            throw new Error('API key is required for Google Gemini');
          }
          return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            model: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        }
        case 'local':
          if (!config.baseUrl) {
            throw new Error('Base URL is required for local models');
          }
          return new ChatOllama({
            baseUrl: config.baseUrl,
            model: config.model,
            dangerouslyAllowBrowser: true,
            verbose: true,
          });
        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }
    } catch (error) {
      console.error(`Error creating model for provider ${providerId}:`, error);
      throw error;
    }
  }

  async configureTools(tools: any[], kubernetesContext: KubernetesToolContext): Promise<void> {
    await this.toolManager.waitForMCPToolsInitialization();

    // Configure the Kubernetes context for the KubernetesTool
    this.toolManager.configureKubernetesContext(kubernetesContext);

    // Get all tools (including MCP tools)
    const allTools = this.toolManager.getLangChainTools();

    // Bind all tools to the model for compatible providers (OpenAI, Azure, etc.)
    this.boundModel = this.toolManager.bindToModel(this.model, this.providerId);

    // Enable direct tool calling for better performance
    if (allTools.length > 0 && this.canUseDirectToolCalling()) {
      this.useDirectToolCalling = true;
      console.log('🔧 Direct tool calling enabled for', allTools.length, 'tools');
    }

    console.log('🔧 Tools configured:', {
      boundModel: !!this.boundModel,
      directToolCalling: this.useDirectToolCalling,
      toolCount: allTools.length,
    });
  }

  /**
   * Check if the current provider can use direct tool calling
   */
  private canUseDirectToolCalling(): boolean {
    // All major providers support direct tool calling
    return ['openai', 'azure', 'anthropic', 'mistral', 'gemini'].includes(this.providerId);
  }

  /**
   * Build user context from current conversation and state
   */
  private buildUserContext(): UserContext {
    // Get the most recent user message
    const recentUserMessages = this.history.filter(prompt => prompt.role === 'user').slice(-3); // Last 3 user messages for context

    const userMessage =
      recentUserMessages.length > 0
        ? recentUserMessages[recentUserMessages.length - 1].content
        : '';

    // Build conversation history
    const conversationHistory = this.history
      .slice(-10) // Last 10 messages
      .map(prompt => ({
        role: prompt.role,
        content: prompt.content,
      }));

    // Get recent tool results
    const lastToolResults: Record<string, any> = {};
    const recentToolResponses = this.history.filter(prompt => prompt.role === 'tool').slice(-5); // Last 5 tool responses

    recentToolResponses.forEach(response => {
      if (response.name) {
        try {
          const parsed = JSON.parse(response.content);
          lastToolResults[response.name] = parsed;
        } catch {
          lastToolResults[response.name] = response.content;
        }
      }
    });

    return {
      userMessage,
      conversationHistory,
      lastToolResults,
      timeContext: new Date(),
    };
  }

  /**
   * Get description for a tool (for approval dialog)
   */
  private getToolDescription(toolName: string, isMCPTool: boolean): string {
    if (isMCPTool) {
      // MCP tool descriptions can be more specific based on tool name
      if (toolName.includes('trace') || toolName.includes('profile')) {
        return 'Traces system calls and processes for debugging';
      } else if (toolName.includes('network') || toolName.includes('socket')) {
        return 'Monitors network connections and traffic';
      } else if (toolName.includes('top') || toolName.includes('process')) {
        return 'Shows running processes and resource usage';
      } else if (toolName.includes('exec') || toolName.includes('run')) {
        return 'Executes commands in containers';
      } else {
        return `Inspektor Gadget debugging tool: ${toolName}`;
      }
    } else {
      // Regular Kubernetes tools
      if (toolName.includes('kubernetes')) {
        return 'Executes Kubernetes API operations';
      }
      return `Kubernetes management tool: ${toolName}`;
    }
  }

  /**
   * Add a tool confirmation message to the history
   */
  public addToolConfirmationMessage(
    content: string,
    toolConfirmation: any,
    updateHistoryCallback?: () => void
  ): void {
    console.log('➕ LangChainManager: Adding tool confirmation message', {
      content,
      toolConfirmation,
    });
    const confirmationPrompt: Prompt = {
      role: 'assistant',
      content: content,
      toolConfirmation: toolConfirmation,
      isDisplayOnly: true, // Don't send to LLM
      requestId: toolConfirmation.requestId, // Add requestId for tracking
    };
    this.history.push(confirmationPrompt);
    console.log(
      '📚 LangChainManager: History after adding confirmation:',
      this.history.length,
      'items'
    );

    // Call the update callback if provided to trigger UI re-render
    if (updateHistoryCallback) {
      updateHistoryCallback();
    }
  }

  public updateToolConfirmationMessage(requestId: string, updatedToolConfirmation: any): void {
    console.log('🔄 LangChainManager: Updating tool confirmation message', {
      requestId,
      updatedToolConfirmation,
    });

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
      console.log('✅ LangChainManager: Tool confirmation message updated');

      // Use the inline tool approval manager to emit update event
      inlineToolApprovalManager.emit('message-updated', { requestId, updatedToolConfirmation });
    } else {
      console.warn('⚠️ LangChainManager: Could not find tool confirmation message to update');
    }
  }

  // Helper method to prepare chat history for prompt template
  private prepareChatHistory(): BaseMessage[] {
    // Filter out system messages and display-only messages to avoid conflicts with the system message in the prompt template
    const filteredHistory = this.history.filter(
      prompt => prompt.role !== 'system' && !prompt.isDisplayOnly
    );
    return this.convertPromptsToMessages(filteredHistory);
  }

  // Helper method to create system prompt with context
  private createSystemPrompt(): string {
    const availableTools = this.toolManager.getToolNames();
    const hasKubernetesTool = availableTools.includes('kubernetes_api_request');

    let systemPromptContent;

    if (!hasKubernetesTool) {
      // Modified prompt when Kubernetes tools are disabled
      systemPromptContent = `You are an AI assistant for the Headlamp Kubernetes UI. You help users understand and manage their Kubernetes resources through a web interface.

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
    } else {
      // Original prompt when tools are available
      systemPromptContent = basePrompt;
    }

    // Add MCP tool guidance if we have MCP tools available
    const mcpTools = this.toolManager.getMCPTools();
    if (mcpTools.length > 0) {
      systemPromptContent += `

MCP TOOL GUIDANCE:
You have access to advanced debugging and monitoring tools through MCP (Model Context Protocol). When users request system analysis, monitoring, or debugging:

INTELLIGENT PARAMETER SETTING:
- When calling MCP tools, intelligently populate parameters based on the user's request and the current context
- For duration parameters: Use reasonable defaults (30 seconds for quick checks, 60-300 seconds for monitoring, 0 for continuous)
- For namespace parameters: Use the current namespace from context, or "default" if not specified
- For filtering parameters: Extract relevant filters from the user's request (pod names, labels, etc.)
- For params objects: Populate with relevant Kubernetes selectors based on context

COMMON MCP TOOL PATTERNS:
- Gadget tools with "snapshot" are for one-time data collection
- Gadget tools with "trace" are for monitoring over time
- Duration 0 means continuous monitoring (use sparingly)
- Always populate the required "params" object, even if empty: {"params": {}}

PARAMETER EXAMPLES:
- For namespace-specific requests: {"params": {"operator.KubeManager.namespace": "target-namespace"}}
- For pod-specific requests: {"params": {"operator.KubeManager.podname": "pod-name"}}
- For monitoring duration: {"duration": 30, "params": {"operator.KubeManager.namespace": "default"}}
- For continuous monitoring: {"duration": 0, "params": {...}}

CONTEXT-AWARE PARAMETER EXTRACTION:
- Extract pod names, namespaces, and labels from the user's request
- Use current cluster context when available
- Default to "default" namespace if not specified
- Apply appropriate filters based on the user's intent

RESULT INTERPRETATION AND PRESENTATION:
When MCP tools return data, you MUST:
1. **Analyze and summarize** - Don't just show raw JSON data
2. **Identify patterns** - Group similar items, highlight anomalies
3. **Format clearly** - Use tables, lists, or structured presentation
4. **Focus on insights** - Explain what the data means, not just what it contains
5. **Highlight issues** - Point out potential security or performance problems

EXAMPLE result processing:
- Socket data → "Found X active connections, Y listening ports, Z external connections"
- Process data → "Identified N processes, M high CPU consumers"
- Network traces → "Detected traffic patterns: internal vs external, protocols used"
- Performance data → "Key metrics: CPU usage X%, memory Y%, network Z Mbps"

NEVER just dump raw JSON - always interpret and present meaningfully.`;
    }

    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    return systemPromptContent;
  }

  // Helper method to create system prompt specifically for tool response processing
  private createToolResponseSystemPrompt(): string {
    const baseSystemPrompt = this.createSystemPrompt();

    // Add specific instructions for tool response processing
    const toolResponseInstructions = `

IMPORTANT: You have just received tool execution results. Your task is to:

1. ANALYZE the tool results and provide a clear, helpful response to the user
2. SUMMARIZE the information in a user-friendly way
3. DO NOT call additional tools unless the user explicitly requests more actions
4. FOCUS on explaining what the tools found or accomplished
5. If the tool results show data (like file listings, directories, etc.), present them in a clear, formatted way

The user is waiting for you to explain what the tools discovered. Provide a direct, informative response based on the tool results.`;

    return baseSystemPrompt + toolResponseInstructions;
  }

  private convertPromptsToMessages(prompts: Prompt[]): BaseMessage[] {
    return prompts.map(prompt => {
      switch (prompt.role) {
        case 'system':
          return new SystemMessage(prompt.content);
        case 'user':
          return new HumanMessage(prompt.content);
        case 'assistant':
          return new AIMessage({
            content: prompt.content,
            additional_kwargs: {},
          });
        case 'tool':
          return new AIMessage(`Tool Response (${prompt.toolCallId}): ${prompt.content}`);

        default:
          return new ChatMessage(prompt.content, prompt.role);
      }
    });
  }

  async userSend(message: string): Promise<Prompt> {
    const userPrompt: Prompt = { role: 'user', content: message };
    this.history.push(userPrompt);

    // Create abort controller for this request
    this.currentAbortController = new AbortController();

    try {
      // Use direct tool calling if enabled
      if (this.useDirectToolCalling) {
        return await this.handleDirectToolCallingRequest(message);
      }

      const modelToUse = this.boundModel || this.model;

      // For local models, use simplified approach
      if (this.providerId === 'local') {
        return await this.handleLocalModelRequest(message, modelToUse);
      }

      // Use chain-based approach for other models
      return await this.handleChainBasedRequest(message, modelToUse);
    } catch (error) {
      return this.handleUserSendError(error);
    }
  }

  // Handle requests using direct tool calling (single LLM call)
  private async handleDirectToolCallingRequest(message: string): Promise<Prompt> {
    try {
      console.log('🔧 Using direct tool calling for request:', message);

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

      // Single LLM call with tool capabilities
      const response = await modelToUse.invoke(messages, {
        signal: this.currentAbortController?.signal,
      });

      this.currentAbortController = null;

      // Handle tool calls if present
      if (response.tool_calls?.length) {
        console.log('🔧 Tool calls detected, processing...');
        return await this.handleToolCalls(response);
      } else {
        console.log('💬 No tool calls detected, treating as regular message');
        // Handle regular response
        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: this.extractTextContent(response.content),
        };
        this.history.push(assistantPrompt);
        return assistantPrompt;
      }
    } catch (error) {
      console.error('Error in direct tool calling request:', error);

      // If direct tool calling fails, fall back to regular approach
      console.log('🔄 Falling back to chain-based approach');
      this.useDirectToolCalling = false;

      const modelToUse = this.boundModel || this.model;
      return await this.handleChainBasedRequest(message, modelToUse);
    }
  }

  // Handle requests for local models (simplified)
  private async handleLocalModelRequest(message: string, model: BaseChatModel): Promise<Prompt> {
    const systemMessage = new SystemMessage(this.createSystemPrompt());
    const userMessage = new HumanMessage(message);
    const messages = [systemMessage, userMessage];

    const response = await model.invoke(messages, {
      signal: this.currentAbortController.signal,
    });

    this.currentAbortController = null;

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
    };
    this.history.push(assistantPrompt);
    return assistantPrompt;
  }

  // Handle requests using chain-based approach
  private async handleChainBasedRequest(message: string, model: BaseChatModel): Promise<Prompt> {
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
      signal: this.currentAbortController.signal,
    });

    this.currentAbortController = null;

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(response),
    };
    this.history.push(assistantPrompt);
    return assistantPrompt;
  }

  // Handle requests for models with tools enabled
  private async handleToolEnabledRequest(chainInput: any, model: BaseChatModel): Promise<Prompt> {
    // Convert chain input to messages for tool-enabled models
    const messages = [
      new SystemMessage(chainInput.systemPrompt),
      ...chainInput.chatHistory,
      new HumanMessage(chainInput.input),
    ];

    // IMPORTANT: Use the boundModel (which has tools) instead of the original model
    const modelToUse = this.boundModel || model;
    console.log('🔧 Using model for tool-enabled request:', {
      usingBoundModel: !!this.boundModel,
      modelHasBindTools: typeof modelToUse.bindTools === 'function',
      toolsAvailable: this.toolManager.getToolNames(),
    });

    const response = await modelToUse.invoke(messages, {
      signal: this.currentAbortController.signal,
    });

    this.currentAbortController = null;

    // Handle tool calls if present
    if (response.tool_calls?.length) {
      console.log(
        '🔧 Tool calls detected:',
        response.tool_calls.length,
        response.tool_calls.map(tc => ({
          name: tc.name,
          args: tc.args,
        }))
      );
      return await this.handleToolCalls(response);
    } else {
      console.log('💬 No tool calls detected in response, treating as regular message');
    }

    // Handle regular response
    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
    };
    this.history.push(assistantPrompt);
    return assistantPrompt;
  }

  // Extract tool call handling into separate method
  private async handleToolCalls(response: any): Promise<Prompt> {
    const enabledToolIds = this.toolManager.getToolNames();

    console.log('🔧 Tool calls detected, processing...', {
      requestedTools: response.tool_calls?.map(tc => tc.name) || [],
      enabledTools: enabledToolIds,
      enabledToolsCount: enabledToolIds.length,
    });

    // If no tools are enabled but LLM is returning tool calls, this indicates a bug
    if (enabledToolIds.length === 0) {
      console.warn('LLM returned tool calls but no tools are enabled. This should not happen.', {
        toolCalls: response.tool_calls,
        modelUsed: this.boundModel === this.model ? 'original' : 'bound',
      });

      // Treat as regular response since no tools should be available
      const assistantPrompt: Prompt = {
        role: 'assistant',
        content:
          this.extractTextContent(response.content) ||
          'I apologize, but I cannot use tools as they have been disabled in your settings.',
      };
      this.history.push(assistantPrompt);
      return assistantPrompt;
    }

    // Filter out disabled tools from tool calls
    const allToolCalls = response.tool_calls.map(tc => ({
      type: 'function',
      id: tc.id,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.args || {}),
      },
    }));

    // Only keep tool calls for enabled tools
    const toolCalls = allToolCalls.filter(tc => enabledToolIds.includes(tc.function.name));

    // Log detailed filtering information
    console.log('🔍 Tool filtering details:', {
      allRequestedTools: allToolCalls.map(tc => tc.function.name),
      enabledTools: enabledToolIds,
      allowedTools: toolCalls.map(tc => tc.function.name),
    });

    // Log if any tools were filtered out
    const filteredOutTools = allToolCalls.filter(tc => !enabledToolIds.includes(tc.function.name));
    if (filteredOutTools.length > 0) {
      console.log(
        '🚫 Filtered out disabled tool calls:',
        filteredOutTools.map(tc => tc.function.name)
      );
      console.log('✅ Enabled tools:', enabledToolIds);
      console.log(
        '🔄 Total tool calls requested:',
        allToolCalls.length,
        'Allowed:',
        toolCalls.length
      );
    } else if (allToolCalls.length > 0) {
      console.log(
        '✅ All requested tools are enabled, proceeding with:',
        toolCalls.map(tc => tc.function.name)
      );
    }

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
      toolCalls: toolCalls,
    };
    this.history.push(assistantPrompt);

    // If all tool calls were filtered out (all requested tools are disabled), handle gracefully
    if (toolCalls.length === 0) {
      console.log('ℹ️ All requested tools are disabled, providing alternative response');

      // Add informational message about disabled tools if any were filtered
      if (filteredOutTools.length > 0) {
        const disabledToolNames = filteredOutTools.map(tc => tc.function.name).join(', ');

        // Replace the AI's response with a clear explanation instead of calling tools again
        const clarifiedResponse = `I understand you're asking for cluster data, but I cannot access live Kubernetes information because the required tools (${disabledToolNames}) are currently disabled in your settings.

To get real-time cluster data, you'll need to:
1. Go to AI Assistant settings
2. Enable the "${disabledToolNames}" tool
3. Ask your question again

Without access to the Kubernetes API, I cannot fetch current pod, deployment, service, or other resource information from your cluster.`;

        // Update the assistant prompt in history with the clarified response
        const updatedPrompt: Prompt = {
          role: 'assistant',
          content: clarifiedResponse,
        };

        // Replace the last history entry with the updated prompt
        this.history[this.history.length - 1] = updatedPrompt;

        return updatedPrompt;
      }

      return assistantPrompt;
    }

    // Prepare tool calls for approval with intelligent argument processing
    const toolCallsForApproval: ToolCall[] = await Promise.all(
      toolCalls.map(async tc => {
        const toolName = tc.function.name;
        const mcpTools = this.toolManager.getMCPTools();
        const isMCPTool = mcpTools.some(tool => tool.name === toolName);
        let processedArguments = JSON.parse(tc.function.arguments);

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

              console.log(`🧠 AI-enhanced arguments for ${toolName}:`, {
                original: JSON.parse(tc.function.arguments),
                enhanced: processedArguments,
              });

              // Mark which fields were enhanced by LLM for UI display
              processedArguments._llmEnhanced = {
                enhanced: true,
                originalArgs: originalArguments,
                enhancedFields: this.identifyEnhancedFields(originalArguments, processedArguments),
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

      // Auto-approve all built-in tools (no user interaction needed)
      const builtInToolIds = builtInTools.map(tool => tool.id);
      approvedToolIds.push(...builtInToolIds);

      // Only request approval for MCP tools
      if (mcpTools.length > 0) {
        console.log('🔐 Requesting approval for', mcpTools.length, 'MCP tools');
        const approvedMCPToolIds = await inlineToolApprovalManager.requestApproval(
          mcpTools,
          this // Pass the AI manager instance
        );
        approvedToolIds.push(...approvedMCPToolIds);
        console.log('✅ MCP tools approved:', approvedMCPToolIds.length, 'of', mcpTools.length);
      }

      // Log built-in tools that were auto-approved
      if (builtInToolIds.length > 0) {
        console.log(
          '✅ Built-in tools auto-executed (no approval needed):',
          builtInToolIds.length,
          builtInTools.map(tool => tool.name)
        );
      }

      console.log(
        '✅ Total tools approved:',
        approvedToolIds.length,
        'of',
        toolCallsForApproval.length
      );

      // Filter tool calls to only execute approved ones and update with processed arguments
      const approvedToolCalls = toolCalls
        .filter(tc => approvedToolIds.includes(tc.id))
        .map(tc => {
          // Find the processed arguments from the approval data
          const approvalData = toolCallsForApproval.find(approval => approval.id === tc.id);
          if (approvalData) {
            return {
              ...tc,
              function: {
                ...tc.function,
                arguments: JSON.stringify(approvalData.arguments),
              },
            };
          }
          return tc;
        });
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
      console.log('❌ Tool approval denied or failed:', error.message);

      // Add denial responses for all tools
      for (const toolCall of toolCalls) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: error.message || 'Tool execution denied',
            userFriendlyMessage: `Tool execution was denied: ${
              error.message || 'User chose not to proceed'
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

    const shouldProcessFollowUp = toolResponses.every(response => {
      try {
        const parsed = JSON.parse(response.content);
        return parsed.shouldProcessFollowUp !== false;
      } catch {
        return true; // Default to processing follow-up if can't parse
      }
    });

    if (shouldProcessFollowUp) {
      return await this.processToolResponses();
    }

    return assistantPrompt;
  }

  // Extract tool call processing logic
  private async processToolCalls(toolCalls: any[], assistantPrompt: Prompt): Promise<void> {
    const failedOperations: string[] = [];

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);

      try {
        // Execute the tool call using ToolManager
        const toolResponse = await this.toolManager.executeTool(
          toolCall.function.name,
          args,
          toolCall.id,
          assistantPrompt
        );

        // Check if the response indicates an error even if the tool didn't throw
        let isErrorResponse = false;
        try {
          const parsedContent = JSON.parse(toolResponse.content);
          isErrorResponse = parsedContent.error === true;

          if (isErrorResponse) {
            const toolName = toolCall.function.name || 'unknown tool';
            const errorMsg = parsedContent.message || 'Unknown error';
            failedOperations.push(`${toolName}: ${errorMsg}`);
          }
        } catch (parseError) {
          // If content isn't JSON, check for error indicators
          const contentLower = toolResponse.content.toLowerCase();
          if (contentLower.includes('error') || contentLower.includes('failed')) {
            const toolName = toolCall.function.name || 'unknown tool';
            failedOperations.push(`${toolName}: ${toolResponse.content}`);
          }
        }

        // Only add to history if the tool response indicates we should
        if (toolResponse.shouldAddToHistory) {
          this.history.push({
            role: 'tool',
            content: toolResponse.content,
            toolCallId: toolCall.id,
            name: toolCall.function.name,
          });
        }
      } catch (error) {
        console.error('Error executing tool call:', error);

        const toolName = toolCall.function.name || 'unknown tool';
        const errorMessage = error?.message || 'Unknown error occurred';
        failedOperations.push(`${toolName}: ${errorMessage}`);

        const errorToolResponse = {
          content: JSON.stringify({
            error: true,
            message: errorMessage,
            toolName: toolName,
            request: args,
            userFriendlyMessage: `Failed to execute ${toolName}: ${errorMessage}`,
          }),
          shouldAddToHistory: true,
          shouldProcessFollowUp: true,
        };

        // Always add error responses to maintain alignment
        this.history.push({
          role: 'tool',
          content: errorToolResponse.content,
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
          failed_operations: failedOperations.join('\n'),
          operation_count: failedOperations.length.toString(),
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
          content: `CRITICAL: The following operations failed and must be reported to the user:

${failedOperations.map(op => `- ${op}`).join('\n')}

You MUST:
1. Clearly inform the user that these operations failed
2. Explain what went wrong in simple terms  
3. Provide specific next steps or alternatives
4. Do not ignore or minimize these errors

Format your response to make the errors prominent and actionable.`,
          toolCallId: 'system-error-alert',
          name: 'error_handler',
        };

        this.history.push(errorSystemMessage);
        console.warn('Tool execution failures detected:', failedOperations);
      }
    }
  }

  // Handle errors in userSend method
  private async handleUserSendError(error: any): Promise<Prompt> {
    // Clear abort controller in case of error
    this.currentAbortController = null;

    console.error('Error in userSend:', error);

    // Handle abort errors
    if (error.message === 'AbortError') {
      const errorPrompt: Prompt = {
        role: 'assistant',
        content: 'Request cancelled.',
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }

    // For API-related errors, use specialized error template to ensure visibility
    const isApiError =
      error.message?.toLowerCase().includes('api') ||
      error.message?.toLowerCase().includes('request') ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('timeout');

    if (isApiError) {
      try {
        // Use the API error template to generate a clear, visible error response
        const errorTemplatePrompt = await apiErrorPromptTemplate.format({
          error_message: this.createUserFriendlyErrorMessage(error),
          error_details: error.message || 'Unknown error',
          context: 'API request processing',
        });

        // Generate a user-friendly response using the AI model
        const errorResponse = await this.model.invoke([
          { role: 'system', content: errorTemplatePrompt },
          { role: 'user', content: 'Please explain this error clearly and suggest next steps.' },
        ]);

        const errorText = this.extractTextContent(errorResponse);

        const apiErrorPrompt: Prompt = {
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
    const errorPrompt: Prompt = {
      role: 'assistant',
      content: `Sorry, there was an error processing your request: ${this.createUserFriendlyErrorMessage(
        error
      )}`,
      error: true,
    };
    this.history.push(errorPrompt);
    return errorPrompt;
  }

  // Helper method to create user-friendly error messages
  private createUserFriendlyErrorMessage(error: any): string {
    if (!error) return 'Unknown error occurred';

    const errorMessage = error.message || error.toString();

    // Common error patterns and their user-friendly equivalents
    const errorMappings = [
      {
        pattern: /network.*error|fetch.*failed|connection.*refused/i,
        message: 'Network connection error. Please check your internet connection and try again.',
      },
      {
        pattern: /timeout|timed out/i,
        message: 'Request timed out. The operation took too long to complete.',
      },
      {
        pattern: /unauthorized|401/i,
        message: 'Authentication error. Please check your credentials.',
      },
      {
        pattern: /forbidden|403/i,
        message: 'Access denied. You may not have permission for this operation.',
      },
      { pattern: /not found|404/i, message: 'The requested resource was not found.' },
      {
        pattern: /rate limit|429/i,
        message: 'Too many requests. Please wait a moment and try again.',
      },
      { pattern: /internal server error|500/i, message: 'Server error. Please try again later.' },
      {
        pattern: /bad gateway|502/i,
        message: 'Gateway error. The server is temporarily unavailable.',
      },
      {
        pattern: /service unavailable|503/i,
        message: 'Service temporarily unavailable. Please try again later.',
      },
      {
        pattern: /gateway timeout|504/i,
        message: 'Gateway timeout. The request took too long to process.',
      },
      {
        pattern: /parse|json/i,
        message: 'Data format error. The response was not in the expected format.',
      },
      { pattern: /abort|cancel/i, message: 'Operation was cancelled.' },
    ];

    // Find matching error pattern
    for (const mapping of errorMappings) {
      if (mapping.pattern.test(errorMessage)) {
        return mapping.message;
      }
    }

    // If no pattern matches, return a simplified version of the original message
    const cleanMessage = errorMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^TypeError:\s*/i, '')
      .replace(/^ReferenceError:\s*/i, '')
      .replace(/^SyntaxError:\s*/i, '')
      .trim();

    return cleanMessage || 'An unexpected error occurred. Please try again.';
  }

  // Change from 'protected' to 'public' to match the base class
  public async processToolResponses(): Promise<Prompt> {
    // Check if there are any tool responses in the history
    if (!this.hasToolResponses()) {
      console.log('🔍 No tool responses found in history');
      return this.getLastAssistantMessage();
    }

    console.log('🔍 Processing tool responses from history');

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

  // Helper method to check if there are tool responses
  private hasToolResponses(): boolean {
    const toolResponses = this.history.filter(
      prompt => prompt.role === 'tool' && prompt.toolCallId
    );
    return toolResponses.length > 0;
  }

  // Helper method to get the last assistant message
  private getLastAssistantMessage(): Prompt {
    const lastAssistantMessage = this.history
      .slice()
      .reverse()
      .find(prompt => prompt.role === 'assistant');
    return (
      lastAssistantMessage || {
        role: 'assistant',
        content: 'No tool responses to process.',
      }
    );
  }

  // Create a specialized chain for tool response processing
  private createToolResponseChain() {
    const modelToUse = this.boundModel || this.model;

    // Create a runnable sequence for tool response processing
    return RunnableSequence.from([
      // Transform input to the expected format
      RunnablePassthrough.assign({
        formattedMessages: (input: any) => {
          const systemMessage = new SystemMessage(input.systemPrompt);
          return [systemMessage, ...input.messages];
        },
      }),
      // Invoke the model
      {
        formattedMessages: (input: any) => modelToUse.invoke(input.formattedMessages),
      },
      // Parse the output
      (input: any) => input.formattedMessages,
    ]);
  }

  // Validate tool call/response alignment
  private validateToolCallAlignment(): void {
    const lastAssistantMessage = this.history
      .slice()
      .reverse()
      .find(prompt => prompt.role === 'assistant' && prompt.toolCalls?.length);

    if (lastAssistantMessage?.toolCalls) {
      const expectedToolCallIds = lastAssistantMessage.toolCalls.map(tc => tc.id);
      const actualToolResponses = this.history.filter(
        prompt => prompt.role === 'tool' && expectedToolCallIds.includes(prompt.toolCallId)
      );

      if (expectedToolCallIds.length !== actualToolResponses.length) {
        console.error('Tool call/response mismatch detected', {
          expectedIds: expectedToolCallIds,
          actualResponses: actualToolResponses.map(r => r.toolCallId),
        });

        // Add missing tool responses
        this.addMissingToolResponses(expectedToolCallIds, actualToolResponses);
      }
    }
  }

  // Add missing tool responses
  private addMissingToolResponses(expectedIds: string[], actualResponses: any[]): void {
    for (const expectedId of expectedIds) {
      if (!actualResponses.find(r => r.toolCallId === expectedId)) {
        this.history.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: 'Tool execution failed - no response recorded',
          }),
          toolCallId: expectedId,
          name: 'kubernetes_api_request',
        });
      }
    }
  }

  // Prepare messages for tool response processing
  private prepareMessagesForToolResponse(): BaseMessage[] {
    const systemMessage = new SystemMessage(this.createSystemPrompt());
    const messages: BaseMessage[] = [systemMessage];

    // Find the last assistant message that contains tool calls
    const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();

    // Process messages up to the last assistant message with tool calls
    const messagesToProcess =
      lastAssistantWithToolsIndex >= 0
        ? this.history.slice(0, lastAssistantWithToolsIndex + 1)
        : this.history;

    // Track response sizes to prevent memory issues
    let totalResponseSize = 0;
    const MAX_RESPONSE_SIZE = 500000; // ~500KB limit

    for (const prompt of messagesToProcess) {
      if (prompt.role === 'tool' && prompt.toolCallId) {
        const processedContent = this.processToolContent(
          prompt,
          totalResponseSize,
          MAX_RESPONSE_SIZE
        );

        if (processedContent) {
          totalResponseSize += processedContent.length;

          // Claude (Anthropic) and Azure don't support FunctionMessage
          if (this.providerId === 'azure' || this.providerId === 'anthropic') {
            messages.push(
              new AIMessage(`Tool Response (${prompt.toolCallId}): ${processedContent}`)
            );
          } else {
            messages.push(
              new FunctionMessage({
                name: prompt.name || 'kubernetes_api_request',
                content: processedContent,
                tool_call_id: prompt.toolCallId,
              })
            );
          }
        }
      } else if (
        prompt.role !== 'assistant' ||
        !prompt.toolCalls ||
        prompt.toolCalls.length === 0
      ) {
        // Skip system messages and display-only messages to avoid ordering issues - system message is already added at the beginning
        if (prompt.role !== 'system' && !prompt.isDisplayOnly) {
          messages.push(...this.convertPromptsToMessages([prompt]));
        }
      }
    }

    return messages;
  }

  // Process tool content with size limits and sanitization
  private processToolContent(prompt: any, currentSize: number, maxSize: number): string | null {
    // Validate the tool response
    if (!prompt.content || typeof prompt.content !== 'string') {
      console.warn(`Invalid tool response format for ${prompt.toolCallId}`, prompt);
      return JSON.stringify({
        error: true,
        message: 'Invalid tool response format',
      });
    }

    const content = prompt.content;

    // Check response size after optimization handling
    const responseSize = content.length;
    if (currentSize + responseSize > maxSize) {
      console.warn(`Tool response size exceeds limit (${currentSize + responseSize}/${maxSize})`);
      return (
        prompt.content.substring(0, 100) +
        `... [Response truncated, exceeded size limit of ${maxSize} bytes]`
      );
    }

    // Sanitize content
    return this.sanitizeContent(content);
  }

  // Find the last assistant message with tool calls
  private findLastAssistantWithTools(): number {
    let lastAssistantWithToolsIndex = -1;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const prompt = this.history[i];
      if (prompt.role === 'assistant' && prompt.toolCalls && prompt.toolCalls.length > 0) {
        lastAssistantWithToolsIndex = i;
        break;
      }
    }
    return lastAssistantWithToolsIndex;
  }

  // Handle the result of tool response processing
  private async handleToolResponseResult(response: any): Promise<Prompt> {
    // Track usage after tool processing
    this.logUsageInfo(response);

    // Analyze and potentially correct kubectl suggestions
    const correctedResponse = await this.analyzeAndCorrectResponse(response);

    const extractedContent = this.extractTextContent(correctedResponse.content);

    // If the model returned empty content but has tool calls, it's trying to call more tools
    // Instead of allowing this, we should provide a fallback response based on the tool results
    if (
      (!extractedContent || extractedContent.trim().length === 0) &&
      response.tool_calls?.length > 0
    ) {
      // Get the most recent tool responses from history
      const recentToolResponses = this.history
        .filter(prompt => prompt.role === 'tool' && prompt.toolCallId)
        .slice(-3) // Get last 3 tool responses
        .map(response => ({
          name: response.name,
          content: response.content,
        }));

      // Create a fallback response based on tool results
      // For MCP tools with formatted output, return them directly without prefix
      if (recentToolResponses.length === 1) {
        const singleResponse = recentToolResponses[0];
        try {
          const parsed = JSON.parse(singleResponse.content);
          if (parsed.formatted && parsed.mcpOutput) {
            // This is a formatted MCP output, return it directly
            const assistantPrompt: Prompt = {
              role: 'assistant',
              content: singleResponse.content,
              toolCalls: [],
            };

            // Clean up history to prevent message order issues
            const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();
            if (lastAssistantWithToolsIndex >= 0) {
              this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
            }

            this.history.push(assistantPrompt);
            return assistantPrompt;
          }
        } catch (e) {
          // Not formatted MCP output, continue with fallback
        }
      }

      // Standard fallback for multiple tools or non-MCP tools
      let fallbackContent = '';

      recentToolResponses.forEach((toolResponse, index) => {
        const toolName = toolResponse.name || 'tool';
        let content = toolResponse.content;

        // Try to parse and clean up the content
        try {
          const parsed = JSON.parse(content);
          if (parsed.formatted && parsed.mcpOutput) {
            // For formatted MCP outputs, return the JSON directly
            content = toolResponse.content;
          } else if (parsed.error) {
            content = `Error: ${parsed.message || 'Tool execution failed'}`;
          } else if (parsed.userFriendlyMessage) {
            content = parsed.userFriendlyMessage;
          } else if (typeof parsed === 'object') {
            content = JSON.stringify(parsed, null, 2);
          }
        } catch (e) {
          // Content is not JSON, use as-is but clean it up
          content = content.toString().trim();
        }

        // For single formatted MCP output, return just the content
        if (recentToolResponses.length === 1) {
          fallbackContent = content;
        } else {
          // For multiple tools, use the tool name format
          fallbackContent += `${toolName}: ${content}${
            index < recentToolResponses.length - 1 ? '\n\n' : ''
          }`;
        }
      });

      const assistantPrompt: Prompt = {
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

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: extractedContent,
      toolCalls:
        correctedResponse.tool_calls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name || 'kubernetes_api_request',
            arguments: JSON.stringify(tc.args || {}),
          },
        })) || [],
    };

    // Clean up history to prevent message order issues
    const lastAssistantWithToolsIndex = this.findLastAssistantWithTools();
    if (lastAssistantWithToolsIndex >= 0) {
      this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
    }

    this.history.push(assistantPrompt);
    return assistantPrompt;
  }

  // Log usage information
  private logUsageInfo(response: any): void {
    let providerName = 'AI Service';
    let estimatedTokens = 0;

    // Estimate tokens
    const outputLength = this.extractTextContent(response.content).length || 0;
    estimatedTokens = Math.ceil(outputLength / 4);

    switch (this.providerId) {
      case 'openai':
        providerName = 'OpenAI';
        break;
      case 'azure':
        providerName = 'Azure OpenAI';
        break;
      case 'anthropic':
        providerName = 'Anthropic';
        break;
      case 'local':
        providerName = 'Local Model';
        break;
    }

    console.log(`${providerName} - Estimated tokens: ${estimatedTokens}`);
  }

  // Analyze response and correct kubectl suggestions
  private async analyzeAndCorrectResponse(response: any): Promise<any> {
    const responseContent = this.extractTextContent(response.content);
    if (responseContent) {
      const lowercaseContent = responseContent.toLowerCase();

      // Check for kubectl suggestion indicators
      const hasKubectlSuggestion =
        lowercaseContent.includes('kubectl') ||
        lowercaseContent.includes('run the command') ||
        lowercaseContent.includes('command line') ||
        lowercaseContent.includes('terminal') ||
        lowercaseContent.includes('shell');

      // If kubectl is being suggested, try to get a correction
      if (hasKubectlSuggestion) {
        return await this.getCorrectedResponse(response);
      }
    }

    return response;
  }

  // Get corrected response for kubectl suggestions
  private async getCorrectedResponse(originalResponse: any): Promise<any> {
    this.history.push({
      role: 'system',
      content:
        'REMINDER: Never suggest kubectl or command line tools. Always use the kubernetes_api_request tool or explain UI actions. The user is using a web dashboard and cannot access the command line.',
    });

    try {
      const modelToUse = this.boundModel || this.model;
      const correctionPrompt = new SystemMessage(
        'Your last response suggested using kubectl or command line, which is not available to the user. Please revise your response to use the kubernetes_api_request tool instead.'
      );

      const messages = [correctionPrompt];
      const correctedResponse = await modelToUse.invoke(messages);
      return correctedResponse;
    } catch (error) {
      console.error('Error getting corrected response:', error);
      return originalResponse; // Return original if correction fails
    }
  }

  // Handle errors in tool response processing
  private handleToolResponseError(error: any): Prompt {
    console.error('Error during tool response processing:', error);

    const errorPrompt: Prompt = {
      role: 'assistant',
      content: `Sorry, there was an error processing the tool responses: ${error.message}`,
      error: true,
    };

    this.history.push(errorPrompt);
    return errorPrompt;
  }

  // Helper method to sanitize content
  private sanitizeContent(content: string): string {
    if (!content) return '';

    try {
      // If it's JSON, parse and re-stringify to ensure it's valid
      if (
        (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
        (content.trim().startsWith('[') && content.trim().endsWith(']'))
      ) {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed);
      }

      // Use sanitize-html for robust HTML sanitization
      return sanitizeHtml(content, {
        allowedTags: [], // Disallow all HTML tags
        allowedAttributes: {}, // Disallow all attributes
        textFilter: text => {
          // Replace image placeholders for consistency with previous implementation
          return text.replace(/\[IMAGE\]/gi, '[IMAGE]');
        },
      });
    } catch (error) {
      console.warn('Error sanitizing content:', error);
      // If sanitization fails, return a safe version
      return typeof content === 'string'
        ? content.substring(0, 5000) // Limit length for safety
        : JSON.stringify({ error: true, message: 'Content could not be sanitized' });
    }
  }

  /**
   * Enhance arguments using AI-like intelligence
   */
  private async enhanceArgumentsWithAI(
    toolName: string,
    toolSchema: any,
    userContext: UserContext,
    originalArgs: Record<string, any>
  ): Promise<Record<string, any>> {
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
      // Fall back to basic enhancement
      const properties = toolSchema.inputSchema.properties;
      const required = toolSchema.inputSchema.required || [];

      // Fill in required fields that are missing or empty
      for (const [fieldName, fieldSchema] of Object.entries(properties)) {
        const isRequired = required.includes(fieldName);
        const currentValue = enhanced[fieldName];

        if (
          isRequired &&
          (currentValue === undefined || currentValue === null || currentValue === '')
        ) {
          // Provide intelligent defaults based on field type and context
          enhanced[fieldName] = this.getIntelligentDefault(fieldName, fieldSchema, userContext);
        }
      }
    }

    return enhanced;
  }

  /**
   * Use LLM to prepare intelligent arguments based on user request and tool schema
   */
  private async prepareLLMArguments(
    toolName: string,
    toolSchema: any,
    userContext: UserContext,
    originalArgs: Record<string, any>
  ): Promise<Record<string, any>> {
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
      const parsedArgs = this.parseArgumentsFromLLMResponse(responseText);

      return parsedArgs;
    } catch (error) {
      console.warn('Failed to prepare arguments with LLM:', error);
      return {};
    }
  }

  /**
   * Create a prompt for the LLM to prepare tool arguments
   */
  private createArgumentPreparationPrompt(
    toolName: string,
    toolSchema: any,
    userContext: UserContext,
    originalArgs: Record<string, any>
  ): { system: string; user: string } {
    const properties = toolSchema.inputSchema?.properties || {};
    const required = toolSchema.inputSchema?.required || [];

    // Create a description of the tool schema
    const schemaDescription = Object.entries(properties)
      .map(([fieldName, fieldSchema]: [string, any]) => {
        const isReq = required.includes(fieldName) ? ' (REQUIRED)' : ' (optional)';
        const type = fieldSchema.type || 'any';
        const desc = fieldSchema.description || 'No description';

        // Handle nested properties for complex objects
        let nestedProps = '';
        if (fieldSchema.properties) {
          nestedProps =
            '\n  Nested properties:\n' +
            Object.entries(fieldSchema.properties)
              .map(
                ([nestedName, nestedSchema]: [string, any]) =>
                  `    - ${nestedName} (${nestedSchema.type || 'any'}): ${
                    nestedSchema.description || 'No description'
                  }`
              )
              .join('\n');
        }

        return `- ${fieldName}${isReq} (${type}): ${desc}${nestedProps}`;
      })
      .join('\n');

    const system = `You are an expert at preparing tool arguments based on user requests. Your task is to analyze the user's request and generate appropriate arguments for the "${toolName}" tool.

TOOL SCHEMA:
${schemaDescription}

INSTRUCTIONS:
1. Analyze the user's request to understand their intent
2. Map their natural language request to the appropriate tool arguments
3. For complex objects (like params), fill in the nested properties based on the user's requirements
4. Use the conversation context to infer missing details
5. Return ONLY a valid JSON object with the tool arguments
6. If a required field cannot be determined from the user's request, provide a sensible default

RESPONSE FORMAT:
Return only valid JSON with the tool arguments. No explanations, no markdown, just the JSON.`;

    const conversationContext =
      userContext.conversationHistory
        ?.slice(-5)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') || '';

    const user = `USER REQUEST: "${userContext.userMessage}"

CONVERSATION CONTEXT:
${conversationContext}

CURRENT ARGUMENTS: ${JSON.stringify(originalArgs, null, 2)}

Based on the user's request and the tool schema above, generate the appropriate arguments for the "${toolName}" tool. Focus on mapping the user's intent to the correct parameter values.

For example, if the user says "get me info only from gadget namespace", the params object should include:
{"operator.KubeManager.namespace": "gadget"}

Return the complete arguments object:`;

    return { system, user };
  }

  /**
   * Parse arguments from LLM response
   */
  private parseArgumentsFromLLMResponse(response: string): Record<string, any> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, try to parse the entire response
      return JSON.parse(response.trim());
    } catch (error) {
      console.warn('Failed to parse LLM response for arguments:', error, response);
      return {};
    }
  }

  /**
   * Identify which fields were enhanced by comparing original and enhanced arguments
   */
  private identifyEnhancedFields(
    original: Record<string, any>,
    enhanced: Record<string, any>
  ): string[] {
    const enhancedFields: string[] = [];

    // Compare each field to see what was added or modified
    for (const [key, enhancedValue] of Object.entries(enhanced)) {
      if (key === '_llmEnhanced') continue; // Skip metadata

      const originalValue = original[key];

      // Field is enhanced if:
      // 1. It didn't exist in original
      // 2. It was null/undefined/empty in original but has value now
      // 3. The value is different
      if (
        !(key in original) ||
        originalValue === null ||
        originalValue === undefined ||
        originalValue === '' ||
        JSON.stringify(originalValue) !== JSON.stringify(enhancedValue)
      ) {
        enhancedFields.push(key);
      }
    }

    return enhancedFields;
  }

  /**
   * Get intelligent default value for a field based on context
   */
  private getIntelligentDefault(
    fieldName: string,
    fieldSchema: any,
    userContext: UserContext
  ): any {
    const fieldType = fieldSchema.type;
    const fieldNameLower = fieldName.toLowerCase();

    // Try to extract from user context first
    if (userContext.userMessage) {
      const userMessage = userContext.userMessage.toLowerCase();

      // Extract namespace
      if (fieldNameLower.includes('namespace')) {
        const namespaceMatch = userMessage.match(/namespace[\s:]+([a-zA-Z0-9-_.]+)/i);
        if (namespaceMatch) {
          return namespaceMatch[1];
        }
        return 'default'; // Default Kubernetes namespace
      }

      // Extract container/pod names
      if (fieldNameLower.includes('container') || fieldNameLower.includes('pod')) {
        const containerMatch = userMessage.match(/(?:container|pod)[\s:]+([a-zA-Z0-9-_.]+)/i);
        if (containerMatch) {
          return containerMatch[1];
        }
      }

      // Extract commands
      if (fieldNameLower.includes('command') || fieldNameLower.includes('cmd')) {
        const commandMatch = userMessage.match(/(?:run|execute|command)[\s:]+["']([^"']+)["']/i);
        if (commandMatch) {
          return commandMatch[1];
        }
      }
    }

    // Fallback to type-based defaults
    switch (fieldType) {
      case 'object':
        return {};
      case 'array':
        return [];
      case 'string':
        if (fieldSchema.enum) {
          return fieldSchema.enum[0];
        }
        return fieldSchema.default || '';
      case 'number':
      case 'integer':
        return fieldSchema.default || fieldSchema.minimum || 0;
      case 'boolean':
        return fieldSchema.default !== undefined ? fieldSchema.default : false;
      default:
        return null;
    }
  }
}
