import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Prompt } from '../../ai/manager';
import { KubernetesTool, KubernetesToolContext } from './kubernetes';
import { AVAILABLE_TOOLS, getToolByName } from './registry';
import { ToolBase, ToolResponse } from './ToolBase';

export class ToolManager {
  private tools: ToolBase[] = [];
  private toolHandlers: Map<string, ToolBase> = new Map();

  constructor() {
    this.initializeTools();
  }

  /**
   * Initialize all available tools from the registry
   */
  private initializeTools(): void {
    for (const ToolClass of AVAILABLE_TOOLS) {
      try {
        const tool = new ToolClass();
        this.addTool(tool);
        console.log(`Loaded tool: ${tool.config.name}`);
      } catch (error) {
        console.error(`Failed to load tool ${ToolClass.name}:`, error);
      }
    }

    console.log(`ToolManager initialized with ${this.tools.length} tools:`, this.getToolNames());
  }

  /**
   * Configure external dependencies for tools that need them
   */
  configureKubernetesContext(context: KubernetesToolContext): void {
    const kubeTool = getToolByName('kubernetes_api_request', this.tools) as KubernetesTool;
    if (kubeTool) {
      // Only set context and log if the tool context has actually changed
      if (!kubeTool.hasContext() || kubeTool.isContextDifferent(context)) {
        kubeTool.setContext(context);
        console.log('Kubernetes context configured for KubernetesTool');
      }
    } else {
      console.warn('KubernetesTool not found, cannot configure context');
    }
  }

  /**
   * Add a tool to the manager (internal method)
   */
  private addTool(tool: ToolBase): void {
    // Check for duplicate tool names
    if (this.toolHandlers.has(tool.config.name)) {
      console.warn(`Tool with name '${tool.config.name}' already exists, skipping`);
      return;
    }

    this.tools.push(tool);
    this.toolHandlers.set(tool.config.name, tool);
  }

  /**
   * Get all configured tools as LangChain tools
   */
  getLangChainTools() {
    return this.tools.map(tool => tool.createLangChainTool());
  }

  /**
   * Execute a tool by name with the given arguments
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ): Promise<ToolResponse> {
    const tool = this.toolHandlers.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    return await tool.handler(args, toolCallId, pendingPrompt);
  }

  /**
   * Bind all tools to a LangChain model
   */
  bindToModel(model: BaseChatModel, providerId: string): BaseChatModel {
    try {
      const langChainTools = this.getLangChainTools();
      if (langChainTools.length === 0) {
        console.warn('No tools configured for binding');
        return model;
      }

      return model.bindTools(langChainTools);
    } catch (error) {
      console.error(`Error binding tools to ${providerId} model:`, error);
      return model;
    }
  }

  /**
   * Get list of all configured tool names
   */
  getToolNames(): string[] {
    return this.tools.map(tool => tool.config.name);
  }

  /**
   * Check if a specific tool is configured
   */
  hasTool(toolName: string): boolean {
    return this.toolHandlers.has(toolName);
  }
}
