import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AzureChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  FunctionMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { tool } from "@langchain/core/tools";
// import { formatString } from "../helper";
import AIManager, { Prompt } from "../ai/manager";
import { z } from "zod";

export default class LangChainManager extends AIManager {
  private model: BaseChatModel;
  private boundModel: BaseChatModel | null = null;
  private providerId: string;
  private toolHandler: ((url: string, method: string, body?: string) => Promise<any>) | null = null;

  constructor(providerId: string, config: Record<string, any>) {
    super();
    this.providerId = providerId;
    console.log(`Creating LangChainManager with provider: ${providerId}`, config);
    this.model = this.createModel(providerId, config);
  }

  private createModel(providerId: string, config: Record<string, any>): BaseChatModel {
    try {
      console.log(`Initializing ${providerId} model with config:`, config);
      switch (providerId) {
        case 'openai':
          if (!config.apiKey) {
            throw new Error("API key is required for OpenAI");
          }
          return new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true
          });
        case 'azure':
          if (!config.apiKey || !config.endpoint || !config.deploymentName) {
            throw new Error("Incomplete Azure OpenAI configuration");
          }
          return new AzureChatOpenAI({
            azureOpenAIEndpoint: config.endpoint.replace(/\/+\$/, ""),
            azureOpenAIApiKey: config.apiKey,
            azureOpenAIApiDeploymentName: config.deploymentName,
            azureOpenAIApiVersion: "2024-12-01-preview",
            modelName: config.model,
            dangerouslyAllowBrowser: true
          });
        case 'anthropic':
          if (!config.apiKey) {
            throw new Error("API key is required for Anthropic");
          }
          return new ChatAnthropic({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true
          });
        case 'local':
          if (!config.baseUrl) {
            throw new Error("Base URL is required for local models");
          }
          return new ChatOllama({
            baseUrl: config.baseUrl,
            model: config.model,
            dangerouslyAllowBrowser: true
          });
        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }
    } catch (error) {
      console.error(`Error creating model for provider ${providerId}:`, error);
      throw error;
    }
  }

  configureTools(tools: any[], handler: (url: string, method: string, body?: string) => Promise<any>): void {
    // Store the handler in a class property
    this.toolHandler = handler;
    
    const kubernetesApiSchema = z.object({
      url: z.string().describe("URL to request, e.g., /api/v1/pods"),
      method: z.string().describe("HTTP method: GET, POST, PATCH, DELETE"),
      body: z.string().optional().describe("Optional HTTP body")
    });
    console.log("Handler function set for tools:", handler);
    
    // Test the handler directly to confirm it works
    try {
      console.log("Testing handler with GET /api/v1/pods...");
      handler("/api/v1/pods", "GET")
        .then(result => console.log("Test handler result:", result))
        .catch(err => console.error("Test handler failed:", err));
    } catch (error) {
      console.error("Error testing handler:", error);
    }
   
    const kubeTool = tool(async ({ url, method, body }) => {
      try {
        if (!this.toolHandler) {
          throw new Error("Tool handler is not configured");
        }
        const response = await this.toolHandler(url, method, body);
        return typeof response === 'string' ? response : JSON.stringify(response);
      } catch (error) {
        console.error("Error in kubeTool:", error);
        return JSON.stringify({ error: true, message: error.message });
      }
    }, {
      name: "kubernetes_api_request",
      description: "Make requests to the Kubernetes API server.",
      schema: kubernetesApiSchema
    });

    try {
      this.boundModel = this.model.bindTools([kubeTool]);
    } catch (error) {
      console.error(`Error binding tools to ${this.providerId} model:`, error);
      this.boundModel = this.model;
    }
  }

  private convertPromptsToMessages(prompts: Prompt[]): BaseMessage[] {
    return prompts.map((prompt) => {
      switch (prompt.role) {
        case 'system':
          return new SystemMessage(prompt.content);
        case 'user':
          return new HumanMessage(prompt.content);
        case 'assistant':
          return new AIMessage({
            content: prompt.content,
            additional_kwargs: this.providerId === 'azure' ? {} : {
              tool_calls: prompt.toolCalls || []
            }
          });
        case 'tool':
          if (this.providerId === 'azure') {
            return new AIMessage(`Tool Response (${prompt.toolCallId}): ${prompt.content}`);
          } else {
            return new FunctionMessage({
              content: prompt.content,
              name: prompt.name || "kubernetes_api_request",
              tool_call_id: prompt.toolCallId
            });
          }
        default:
          return new ChatMessage(prompt.content, prompt.role);
      }
    });
  }

  private formatContext() {
    return Object.entries(this.contexts)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n\n");
  }

  async userSend(message: string): Promise<Prompt> {
    console.log("User message sent:", message);
    console.log("Current history:", this.history);
    console.log("provider id", this.providerId);

    const userPrompt: Prompt = { role: 'user', content: message };
    this.history.push(userPrompt);

    const systemMessage = new SystemMessage(
        `You are a Kubernetes assistant. ${this.formatContext()}`
    );

    const messages = this.convertPromptsToMessages(this.history);
    messages.unshift(systemMessage);
    const modelToUse = this.boundModel || this.model;

    try {
        const response = await modelToUse.invoke(messages);
        console.log("Model response received:", response);

        if (response.tool_calls?.length) {
            const toolCalls = response.tool_calls.map(tc => ({
                type: 'function',
                id: tc.id,
                function: {
                    name: tc.name || "kubernetes_api_request",
                    arguments: JSON.stringify(tc.args || {})
                }
            }));

            const assistantPrompt: Prompt = {
                role: 'assistant',
                content: response.content || '',
                toolCalls: toolCalls
            };
            this.history.push(assistantPrompt);

            for (const toolCall of toolCalls) {
                const args = JSON.parse(toolCall.function.arguments);
                console.log("Invoking tool with arguments:", args);

                let result;
                try {
                    // Use the class toolHandler instead of this.contexts?.handler
                    if (this.toolHandler) {
                        console.log(`Calling toolHandler with ${args.url}, ${args.method}${args.body ? ', ' + args.body : ''}`);
                        result = await this.toolHandler(args.url, args.method, args.body);
                        console.log("Tool response received:", result);
                    } else {
                        console.error("Tool handler is not configured");
                        result = JSON.stringify({ error: true, message: "Tool handler is not configured" });
                    }
                } catch (error) {
                    console.error("Error invoking tool:", error);
                    result = JSON.stringify({ error: true, message: error.message });
                }

                if (!result) {
                    result = "No response from tool.";
                }

                this.history.push({
                    role: 'tool',
                    content: typeof result === 'string' ? result : JSON.stringify(result),
                    toolCallId: toolCall.id,
                    name: toolCall.function.name,
                });
            }

            return await this.processToolResponses();
        }

        const assistantPrompt: Prompt = {
            role: 'assistant',
            content: response.content || '',
            toolCalls: response.tool_calls?.map(tc => ({
                id: tc.id,
                type: tc.type,
                function: {
                    name: tc.name || "kubernetes_api_request",
                    arguments: JSON.stringify(tc.args || {}),
                },
            })) || [],
        };
        this.history.push(assistantPrompt);
        return assistantPrompt;

    } catch (error) {
        console.error("Error in userSend:", error);
        const errorPrompt: Prompt = {
            role: 'assistant',
            content: `Sorry, there was an error processing your request with ${this.providerId}: ${error.message}`,
            error: true
        };
        this.history.push(errorPrompt);
        return errorPrompt;
    }
}

  private async processToolResponses(): Promise<Prompt> {
    console.log("Processing tool responses...");
  
    const systemMessage = new SystemMessage(
      `You are a Kubernetes assistant. ${this.formatContext()}`
    );
  
    const messages: BaseMessage[] = [systemMessage];
  
    for (const prompt of this.history) {
      if (prompt.role === 'tool' && prompt.toolCallId) {
        console.log("Adding tool response to messages:", {
          toolCallId: prompt.toolCallId,
          content: prompt.content,
          name: prompt.name,
        });
  
        if (this.providerId === 'azure') {
          messages.push(new AIMessage(`Tool Response (${prompt.toolCallId}): ${prompt.content}`));
        } else {
          messages.push(new FunctionMessage({
            name: prompt.name || 'kubernetes_api_request',
            content: prompt.content,
            tool_call_id: prompt.toolCallId,
          }));
        }
      } else {
        console.log("Adding non-tool prompt to messages:", { role: prompt.role, content: prompt.content });
        messages.push(...this.convertPromptsToMessages([prompt]));
      }
    }
  
    const modelToUse = this.boundModel || this.model;
    console.log("Invoking model with messages:", messages);
  
    try {
      const response = await modelToUse.invoke(messages);
      console.log("Model response received:", response);
  
      const assistantPrompt: Prompt = {
        role: 'assistant',
        content: response.content || '',
        toolCalls: response.tool_calls?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name || "kubernetes_api_request",
            arguments: JSON.stringify(tc.args || {}),
          },
        })) || [],
      };
  
      console.log("Assistant prompt created from response:", assistantPrompt);
  
      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error("Error during model invocation in processToolResponses:", error);
  
      const errorPrompt: Prompt = {
        role: 'assistant',
        content: `Sorry, there was an error processing the tool responses: ${error.message}`,
        error: true,
      };
  
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }
}