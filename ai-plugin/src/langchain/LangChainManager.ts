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
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { AzureChatOpenAI } from '@langchain/openai';
import sanitizeHtml from 'sanitize-html';
import AIManager, { Prompt } from '../ai/manager';
import { basePrompt } from '../ai/prompts';
import { KubernetesToolContext, ToolManager, ToolResponse } from './tools';

export default class LangChainManager extends AIManager {
  private model: BaseChatModel;
  private boundModel: BaseChatModel | null = null;
  private providerId: string;
  private toolManager: ToolManager;

  constructor(providerId: string, config: Record<string, any>) {
    super();
    this.providerId = providerId;
    this.toolManager = new ToolManager(); // Initialize with empty config for now
    console.log(`Creating LangChainManager with provider: ${providerId}`, config);
    this.model = this.createModel(providerId, config);
  }

  private createModel(providerId: string, config: Record<string, any>): BaseChatModel {
    try {
      console.log(`Initializing ${providerId} model with config:`, config);
      switch (providerId) {
        case 'openai':
          if (!config.apiKey) {
            throw new Error('API key is required for OpenAI');
          }
          return new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
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
          });
        case 'anthropic':
          if (!config.apiKey) {
            throw new Error('API key is required for Anthropic');
          }
          return new ChatAnthropic({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'mistral':
          if (!config.apiKey) {
            throw new Error('API key is required for Mistral AI');
          }
          return new ChatMistralAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'gemini': {
          if (!config.apiKey) {
            throw new Error('API key is required for Google Gemini');
          }
          if (
            !['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'].includes(
              config.model
            )
          ) {
            throw new Error(`Invalid Gemini model: ${config.model}`);
          }
          return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        }
        case 'local':
          if (!config.baseUrl) {
            throw new Error('Base URL is required for local models');
          }
          console.log('Creating ChatOllama with config:', {
            baseUrl: config.baseUrl,
            model: config.model,
          });
          return new ChatOllama({
            baseUrl: config.baseUrl,
            model: config.model,
            dangerouslyAllowBrowser: true,
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
    // Configure the Kubernetes context for the KubernetesTool
    this.toolManager.configureKubernetesContext(kubernetesContext);

    // Bind all tools to the model
    this.boundModel = this.toolManager.bindToModel(this.model, this.providerId);
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
            additional_kwargs:
              this.providerId === 'azure'
                ? {}
                : {
                    tool_calls: prompt.toolCalls || [],
                  },
          });
        case 'tool':
          if (this.providerId === 'azure') {
            return new AIMessage(`Tool Response (${prompt.toolCallId}): ${prompt.content}`);
          } else {
            return new FunctionMessage({
              content: prompt.content,
              name: prompt.name || 'kubernetes_api_request',
              tool_call_id: prompt.toolCallId,
            });
          }
        default:
          return new ChatMessage(prompt.content, prompt.role);
      }
    });
  }

  private formatContext() {
    return this.currentContext || '';
  }

  async userSend(message: string): Promise<Prompt> {
    console.log('User message sent:', message);
    const userPrompt: Prompt = { role: 'user', content: message };
    this.history.push(userPrompt);

    // Create system message with context if available
    let systemPromptContent = basePrompt;
    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    const systemMessage = new SystemMessage(systemPromptContent);

    const messages = this.convertPromptsToMessages(this.history);
    messages.unshift(systemMessage);
    const modelToUse = this.boundModel || this.model;

    // Log messages being sent to local models for debugging
    if (this.providerId === 'local') {
      console.log(
        'Sending messages to local model:',
        messages.map((msg, index) => ({
          index,
          type: msg.constructor.name,
          content:
            typeof msg.content === 'string'
              ? msg.content.substring(0, 100) + '...'
              : 'non-string content',
        }))
      );
    }

    try {
      // Add timeout for local models since they might be slower
      let response;
      if (this.providerId === 'local') {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Local model response timed out')), 120000); // 2 minute timeout for local models
        });

        const responsePromise = modelToUse.invoke(messages);
        response = await Promise.race([responsePromise, timeoutPromise]);
      } else {
        response = await modelToUse.invoke(messages);
      }

      console.log('Model response received:', response);

      // For local models, handle responses differently
      if (this.providerId === 'local') {
        console.log('Local model response received:', {
          content:
            response.content?.substring(0, 200) + (response.content?.length > 200 ? '...' : ''),
          contentLength: response.content?.length || 0,
          hasToolCalls: !!response.tool_calls?.length,
        });

        // Ensure we have valid content
        let responseContent = response.content || '';
        if (typeof responseContent !== 'string') {
          console.warn('Local model returned non-string content, converting to string');
          responseContent = String(responseContent);
        }

        // If response is empty or very short, provide a fallback
        if (!responseContent.trim()) {
          console.warn('Local model returned empty response, providing fallback');
          responseContent =
            "I'm sorry, but I couldn't generate a response. Please try rephrasing your question or check if your local model is running properly.";
        }

        // Check if the response suggests tool usage is needed
        const needsToolCall = this.shouldUseToolCall(message, responseContent);

        console.log('Local model analysis:', {
          userMessage: message,
          needsToolCall,
          responseContentLength: responseContent.length,
        });

        if (needsToolCall) {
          // For local models, we'll manually construct a tool call if needed
          console.log('Local model response suggests tool usage needed, but tools not bound');

          // Add a note to the response about using the API tool
          const enhancedContent =
            responseContent +
            '\n\n*Note: To get actual cluster data, you can use the kubernetes_api_request tool in the interface.*';

          const assistantPrompt: Prompt = {
            role: 'assistant',
            content: enhancedContent,
          };
          this.history.push(assistantPrompt);
          console.log('Local model assistant prompt created:', assistantPrompt);
          return assistantPrompt;
        } else {
          // Simple response, no tool calls needed
          const assistantPrompt: Prompt = {
            role: 'assistant',
            content: responseContent,
          };
          this.history.push(assistantPrompt);
          console.log('Local model simple response created:', assistantPrompt);
          return assistantPrompt;
        }
      }

      if (response.tool_calls?.length) {
        const toolCalls = response.tool_calls.map(tc => ({
          type: 'function',
          id: tc.id,
          function: {
            name: tc.name || 'kubernetes_api_request',
            arguments: JSON.stringify(tc.args || {}),
          },
        }));

        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: response.content || '',
          toolCalls: toolCalls,
        };
        this.history.push(assistantPrompt);

        // Process each tool call
        const toolResponses: Array<{ toolCall: any; response: ToolResponse }> = [];

        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Processing tool call:', args);

          try {
            // Execute the tool call using ToolManager
            const toolResponse = await this.toolManager.executeTool(
              toolCall.function.name,
              args,
              toolCall.id,
              assistantPrompt
            );

            toolResponses.push({ toolCall, response: toolResponse });

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
            this.history.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: error.message,
              }),
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }

        // Only process follow-up if all tool responses indicate we should
        const shouldProcessFollowUp = toolResponses.every(
          ({ response }) => response.shouldProcessFollowUp
        );

        if (shouldProcessFollowUp) {
          return await this.processToolResponses();
        }

        return assistantPrompt;
      }

      // Handle regular response
      const assistantPrompt: Prompt = {
        role: 'assistant',
        content: response.content || '',
      };
      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error('Error in userSend:', error);

      // Special handling for local model errors
      if (this.providerId === 'local') {
        let errorMessage = error.message;

        if (error.message.includes('timed out')) {
          errorMessage =
            'Local model response timed out. Please check if your local model is running and try again.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage =
            'Unable to connect to local model. Please check if your local model server is running at the configured URL.';
        } else if (error.message.includes('model')) {
          errorMessage =
            'Local model error. Please check if the specified model is available in your local model server.';
        }

        const errorPrompt: Prompt = {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

      const errorPrompt: Prompt = {
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${error.message}`,
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  // Helper method to determine if a tool call is needed for local models
  private shouldUseToolCall(userMessage: string, responseContent: string): boolean {
    const message = userMessage.toLowerCase();
    const response = responseContent.toLowerCase();

    // Keywords that suggest cluster data is needed
    const clusterDataKeywords = [
      'list',
      'show',
      'get',
      'find',
      'check',
      'what',
      'how many',
      'status',
      'pods',
      'services',
      'deployments',
      'nodes',
      'namespaces',
      'configmaps',
      'secrets',
      'ingress',
      'persistentvolumeclaims',
      'events',
      'logs',
    ];

    // Check if user is asking for cluster data
    const askingForData = clusterDataKeywords.some(keyword => message.includes(keyword));

    // Check if response suggests data is needed but not available
    const needsData =
      response.includes("i don't have access") ||
      response.includes('i cannot see') ||
      response.includes("i don't have the data") ||
      response.includes('i would need to check') ||
      response.includes('you would need to run');

    return askingForData || needsData;
  }

  // Change from 'protected' to 'public' to match the base class
  public async processToolResponses(): Promise<Prompt> {
    console.log('Processing tool responses...');

    // Check if there are any tool responses in the history
    const hasToolResponses = this.history.some(
      prompt => prompt.role === 'tool' && prompt.toolCallId
    );
    if (!hasToolResponses) {
      console.log('No tool responses found, returning early');
      // If no tool responses, return the last assistant message
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

    let systemPromptContent = basePrompt;
    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    const systemMessage = new SystemMessage(systemPromptContent);

    const messages: BaseMessage[] = [systemMessage];

    // Track tool response sizes
    let totalResponseSize = 0;
    const MAX_RESPONSE_SIZE = 500000; // ~500KB limit for total responses

    try {
      // Find the last assistant message that contains tool calls
      let lastAssistantWithToolsIndex = -1;
      for (let i = this.history.length - 1; i >= 0; i--) {
        const prompt = this.history[i];
        if (prompt.role === 'assistant' && prompt.toolCalls && prompt.toolCalls.length > 0) {
          lastAssistantWithToolsIndex = i;
          break;
        }
      }

      // Validate and sanitize tool responses before adding to messages
      // Only include messages up to the last assistant message with tool calls
      const messagesToProcess =
        lastAssistantWithToolsIndex >= 0
          ? this.history.slice(0, lastAssistantWithToolsIndex + 1)
          : this.history;

      for (const prompt of messagesToProcess) {
        if (prompt.role === 'tool' && prompt.toolCallId) {
          // Validate the tool response
          if (!prompt.content) {
            // Use a safe placeholder instead of empty content
            continue;
          }
          if (!prompt.content || typeof prompt.content !== 'string') {
            console.warn(`Invalid tool response format for ${prompt.toolCallId}`, prompt);
            // Use a safe placeholder instead of potentially unsafe content
            prompt.content = JSON.stringify({
              error: true,
              message: 'Invalid tool response format',
            });
          }

          // Check response size to prevent memory issues
          const responseSize = prompt.content.length;
          totalResponseSize += responseSize;

          if (totalResponseSize > MAX_RESPONSE_SIZE) {
            console.warn(
              `Tool response size exceeds limit (${totalResponseSize}/${MAX_RESPONSE_SIZE})`
            );
            // Truncate and indicate truncation
            prompt.content =
              prompt.content.substring(0, 100) +
              `... [Response truncated, exceeded size limit of ${MAX_RESPONSE_SIZE} bytes]`;
          }

          // Sanitize response content (basic HTML/script tag removal)
          // This helps prevent potential XSS or script injection if displayed in UI
          const sanitizedContent = this.sanitizeContent(prompt.content);

          console.log('Adding validated tool response to messages:', {
            toolCallId: prompt.toolCallId,
            contentLength: sanitizedContent.length,
            name: prompt.name,
          });

          if (this.providerId === 'azure') {
            messages.push(
              new AIMessage(`Tool Response (${prompt.toolCallId}): ${sanitizedContent}`)
            );
          } else {
            messages.push(
              new FunctionMessage({
                name: prompt.name || 'kubernetes_api_request',
                content: sanitizedContent,
                tool_call_id: prompt.toolCallId,
              })
            );
          }
        } else if (
          prompt.role !== 'assistant' ||
          !prompt.toolCalls ||
          prompt.toolCalls.length === 0
        ) {
          // Only include non-assistant messages or assistant messages without tool calls
          // This ensures we don't include the assistant message that contains tool calls
          console.log('Adding non-tool prompt to messages:', {
            role: prompt.role,
            contentLength: prompt.content?.length || 0,
          });
          messages.push(...this.convertPromptsToMessages([prompt]));
        }
      }

      const modelToUse = this.boundModel || this.model;
      console.log(
        'Invoking model with messages:',
        messages.map((m, index) => ({
          index,
          type: m.constructor.name,
          // Safely access content without calling _getContent
          length:
            typeof m.content === 'string'
              ? m.content.length
              : m.content
              ? JSON.stringify(m.content).length
              : 0,
        }))
      );

      // Log the last message type to help debug message order issues
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        console.log('Last message type:', lastMessage.constructor.name);
      }

      try {
        // Add timeout for model invocation
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Model invocation timed out')), 60000); // 60 second timeout
        });

        const responsePromise = modelToUse.invoke(messages);
        let response = await Promise.race([responsePromise, timeoutPromise]);

        // Track usage after tool processing with consistent provider naming
        let providerName = 'AI Service';
        let estimatedTokens = 0;

        // Estimate tokens based on messages and response length
        const messagesLength = messages.reduce(
          (acc, msg) => acc + (typeof msg.content === 'string' ? msg.content.length : 0),
          0
        );
        const outputLength = response.content?.length || 0;
        estimatedTokens = Math.ceil((messagesLength + outputLength) / 4);

        switch (this.providerId) {
          case 'openai':
            providerName = 'OpenAI';
            break;
          case 'azure':
            providerName = 'Azure OpenAI'; // Ensure consistent naming
            break;
          case 'anthropic':
            providerName = 'Anthropic';
            break;
          case 'local':
            providerName = 'Local Model';
            break;
        }

        console.log(`${providerName} - Estimated tokens: ${estimatedTokens}`);

        console.log('Model response received:', {
          content:
            response.content?.substring(0, 100) + (response.content?.length > 100 ? '...' : ''),
          toolCallsCount: response.tool_calls?.length || 0,
        });

        // Add this to the formatResponse method after getting a tool response
        if (response && typeof response === 'string' && response.includes('"items":')) {
          try {
            // This looks like a list response - add a note not to suggest kubectl
            const enhancedResponse = {
              ...JSON.parse(response),
              note: 'Remember to use the kubernetes_api_request tool for all operations rather than suggesting kubectl commands.',
            };
            response = JSON.stringify(enhancedResponse);
          } catch (e) {
            // Keep original response if parsing fails
          }
        }

        // Analyze the response content to detect if it might be suggesting kubectl
        if (response.content && typeof response.content === 'string') {
          const lowercaseContent = response.content.toLowerCase();

          // Check for kubectl suggestion indicators
          const hasKubectlSuggestion =
            lowercaseContent.includes('kubectl') ||
            lowercaseContent.includes('run the command') ||
            lowercaseContent.includes('command line') ||
            lowercaseContent.includes('terminal') ||
            lowercaseContent.includes('shell');

          // If it looks like kubectl is being suggested, add a corrective system message
          if (hasKubectlSuggestion) {
            this.history.push({
              role: 'system',
              content:
                'REMINDER: Never suggest kubectl or command line tools. Always use the kubernetes_api_request tool or explain UI actions. The user is using a web dashboard and cannot access the command line.',
            });

            // Request a correction from the model
            const correctionPrompt = new SystemMessage(
              'Your last response suggested using kubectl or command line, which is not available to the user. Please revise your response to use the kubernetes_api_request tool instead.'
            );

            messages.push(correctionPrompt);

            // Try to get a corrected response
            try {
              const correctedResponse = await modelToUse.invoke(messages);
              response = correctedResponse; // Replace with the corrected response
            } catch (error) {
              console.error('Error getting corrected response:', error);
              // Continue with original response if correction fails
            }
          }
        }

        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: response.content || '',
          toolCalls:
            response.tool_calls?.map(tc => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.name || 'kubernetes_api_request',
                arguments: JSON.stringify(tc.args || {}),
              },
            })) || [],
        };

        console.log('Assistant prompt created from response');

        // Remove any existing assistant messages that come after the last tool call
        // to prevent message order issues
        if (lastAssistantWithToolsIndex >= 0) {
          this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
        }

        this.history.push(assistantPrompt);
        return assistantPrompt;
      } catch (error) {
        console.error('Error during model invocation in processToolResponses:', error);

        const errorPrompt: Prompt = {
          role: 'assistant',
          content: `Sorry, there was an error processing the tool responses: ${error.message}`,
          error: true,
        };

        this.history.push(errorPrompt);
        return errorPrompt;
      }
    } catch (error) {
      console.error('Error preparing messages for model in processToolResponses:', error);

      const errorPrompt: Prompt = {
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${error.message}`,
        error: true,
      };

      this.history.push(errorPrompt);
      return errorPrompt;
    }
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
