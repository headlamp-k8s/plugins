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

  constructor(providerId: string, config: Record<string, any>, enabledTools?: string[]) {
    super();
    this.providerId = providerId;
    const enabledToolIds = enabledTools ?? [];
    console.log(
      'AI Assistant: Initializing with enabled tools:',
      enabledToolIds || 'all tools enabled'
    );
    this.toolManager = new ToolManager(enabledToolIds); // Only enabled tools
    this.model = this.createModel(providerId, config);

    // Initialize prompt template and output parser
    this.promptTemplate = this.createPromptTemplate();
    this.outputParser = new StringOutputParser();
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
    const sanitizeString = (value: unknown): string =>
      typeof value === 'string' ? value.trim() : '';
    const sanitizedConfig = {
      ...config,
      apiKey: sanitizeString(config.apiKey),
      endpoint: sanitizeString(config.endpoint),
      baseUrl: sanitizeString(config.baseUrl),
      deploymentName: sanitizeString(config.deploymentName),
      model: sanitizeString(config.model),
    };

    try {
      switch (providerId) {
        case 'openai':
          if (!sanitizedConfig.apiKey) {
            throw new Error('API key is required for OpenAI');
          }
          return new ChatOpenAI({
            apiKey: sanitizedConfig.apiKey,
            modelName: sanitizedConfig.model,
            verbose: true,
          });
        case 'azure':
          if (
            !sanitizedConfig.apiKey ||
            !sanitizedConfig.endpoint ||
            !sanitizedConfig.deploymentName
          ) {
            throw new Error('Incomplete Azure OpenAI configuration');
          }
          return new AzureChatOpenAI({
            // Strip trailing slashes only
            azureOpenAIEndpoint: sanitizedConfig.endpoint.replace(/\/+$/, ''),
            azureOpenAIApiKey: sanitizedConfig.apiKey,
            azureOpenAIApiDeploymentName: sanitizedConfig.deploymentName,
            azureOpenAIApiVersion: '2024-12-01-preview',
            modelName: sanitizedConfig.model,
            verbose: true,
          });
        case 'anthropic':
          if (!sanitizedConfig.apiKey) {
            throw new Error('API key is required for Anthropic');
          }
          return new ChatAnthropic({
            apiKey: sanitizedConfig.apiKey,
            modelName: sanitizedConfig.model,
            verbose: true,
          });
        case 'mistral':
          if (!sanitizedConfig.apiKey) {
            throw new Error('API key is required for Mistral AI');
          }
          return new ChatMistralAI({
            apiKey: sanitizedConfig.apiKey,
            modelName: sanitizedConfig.model,
            verbose: true,
          });
        case 'gemini': {
          if (!sanitizedConfig.apiKey) {
            throw new Error('API key is required for Google Gemini');
          }
          return new ChatGoogleGenerativeAI({
            apiKey: sanitizedConfig.apiKey,
            model: sanitizedConfig.model,
            verbose: true,
          });
        }
        case 'local':
          if (!sanitizedConfig.baseUrl) {
            throw new Error('Base URL is required for local models');
          }
          return new ChatOllama({
            baseUrl: sanitizedConfig.baseUrl,
            model: sanitizedConfig.model,
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

  configureTools(tools: any[], kubernetesContext: KubernetesToolContext): void {
    console.log('🔧 Configuring tools for LangChain with context:', {
      toolCount: tools.length,
      selectedClusters: kubernetesContext.selectedClusters,
      providerId: this.providerId,
    });

    // Configure the Kubernetes context for the KubernetesTool
    this.toolManager.configureKubernetesContext(kubernetesContext);

    // Bind all tools to the model for compatible providers (OpenAI, Azure, etc.)
    this.boundModel = this.toolManager.bindToModel(this.model, this.providerId);

    console.log('🔧 Tools bound to model successfully, boundModel exists:', !!this.boundModel);
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
    let systemPromptContent = basePrompt;
    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    return systemPromptContent;
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

    const toolCalls = response.tool_calls.map(tc => ({
      type: 'function',
      id: tc.id,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.args || {}),
      },
    }));

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(response.content),
      toolCalls: toolCalls,
    };
    this.history.push(assistantPrompt);

    // Process tool calls
    await this.processToolCalls(toolCalls, assistantPrompt);

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
      return this.getLastAssistantMessage();
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
        systemPrompt: this.createSystemPrompt(),
      });

      return this.handleToolResponseResult(response);
    } catch (error) {
      return this.handleToolResponseError(error);
    }
  }

  // Helper method to check if there are tool responses
  private hasToolResponses(): boolean {
    return this.history.some(prompt => prompt.role === 'tool' && prompt.toolCallId);
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

    // Check response size
    const responseSize = prompt.content.length;
    if (currentSize + responseSize > maxSize) {
      console.warn(`Tool response size exceeds limit (${currentSize + responseSize}/${maxSize})`);
      return (
        prompt.content.substring(0, 100) +
        `... [Response truncated, exceeded size limit of ${maxSize} bytes]`
      );
    }

    // Sanitize content
    return this.sanitizeContent(prompt.content);
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

    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: this.extractTextContent(correctedResponse.content),
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

    console.log('Assistant prompt created from response');

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
}
