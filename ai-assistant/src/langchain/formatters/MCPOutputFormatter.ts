import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export interface FormattedMCPOutput {
  type: 'table' | 'metrics' | 'list' | 'graph' | 'text' | 'error' | 'raw';
  title: string;
  summary: string;
  data: any;
  insights?: string[];
  warnings?: string[];
  actionable_items?: string[];
  metadata?: {
    toolName: string;
    responseSize: number;
    processingTime: number;
    dataPoints?: number;
  };
}

export interface MCPFormatterOptions {
  maxTokens?: number;
  includeInsights?: boolean;
  includeActionableItems?: boolean;
  formatStyle?: 'detailed' | 'compact' | 'minimal';
}

export class MCPOutputFormatter {
  private model: BaseChatModel;
  private readonly SYSTEM_PROMPT = `You are an expert data analyst specializing in Kubernetes debugging and system monitoring data. Your task is to analyze raw tool outputs and format them in a user-friendly way.

CRITICAL INSTRUCTIONS:
1. ALWAYS respond with valid JSON in the exact schema provided
2. Analyze the raw data to identify patterns, anomalies, and key insights
3. Format data appropriately based on its type (tables for structured data, metrics for numbers, etc.)
4. Provide actionable insights and recommendations
5. Highlight any security issues, performance problems, or anomalies
6. Keep summaries concise but informative
7. If data contains sensitive information, sanitize it appropriately

RESPONSE SCHEMA:
{
  "type": "table" | "metrics" | "list" | "graph" | "text" | "error" | "raw",
  "title": "Clear, descriptive title",
  "summary": "Brief summary of what the data shows",
  "data": "Formatted data structure (varies by type)",
  "insights": ["Key insights from the data"],
  "warnings": ["Any security or performance warnings"],
  "actionable_items": ["Specific actions the user should consider"],
  "metadata": {
    "toolName": "Name of the tool that generated this data",
    "responseSize": "Size in bytes",
    "processingTime": "Time taken to process",
    "dataPoints": "Number of data points if applicable"
  }
}

DATA TYPE FORMATTING GUIDELINES:

TABLE: For structured data like process lists, network connections, resource usage
{
  "type": "table",
  "data": {
    "headers": ["Column1", "Column2", ...],
    "rows": [["value1", "value2", ...], ...],
    "sortBy": "column_name",
    "highlightRows": [row_indices_with_issues]
  }
}

ERROR: For tool failures, schema mismatches, or execution errors
{
  "type": "error",
  "data": {
    "message": "Clear, user-friendly error description",
    "details": "Technical error details or original error message",
    "suggestions": [
      "Check the tool configuration and parameters",
      "Verify input data format matches expected schema",
      "Review tool documentation for correct usage"
    ]
  }
}

METRICS: For numerical data, statistics, and KPIs
{
  "type": "metrics",
  "data": {
    "primary": [{"label": "CPU Usage", "value": "85%", "status": "warning"}],
    "secondary": [{"label": "Memory", "value": "4.2GB", "status": "normal"}],
    "trends": [{"label": "Network I/O", "value": "↑ 15%", "status": "info"}]
  }
}

LIST: For simple lists, logs, or sequential data
{
  "type": "list",
  "data": {
    "items": [
      {"text": "Item description", "status": "normal|warning|error", "metadata": "additional info"}
    ],
    "grouped": false
  }
}

GRAPH: For time-series or relationship data
{
  "type": "graph",
  "data": {
    "chartType": "line|bar|pie|scatter",
    "datasets": [{"label": "Dataset name", "data": [...]}],
    "labels": [...],
    "description": "What the graph represents"
  }
}

TEXT: For unstructured text, logs, or narrative explanations
{
  "type": "text",
  "data": {
    "content": "Formatted text content",
    "language": "json|yaml|shell|text",
    "highlights": ["Important phrases to highlight"]
  }
}

ERROR: For error responses or failed tool executions
{
  "type": "error",
  "data": {
    "message": "User-friendly error message",
    "details": "Technical details if available",
    "suggestions": ["Possible solutions or next steps"]
  }
}

Remember: Focus on making complex data accessible and actionable for Kubernetes operators and developers.`;

  constructor(model: BaseChatModel) {
    this.model = model;
  }

  /**
   * Format MCP tool output using AI analysis
   */
  async formatMCPOutput(
    rawOutput: string,
    toolName: string,
    options: MCPFormatterOptions = {}
  ): Promise<FormattedMCPOutput> {
    const startTime = Date.now();

    try {
      // Prepare options with defaults
      const opts = {
        maxTokens: 4000,
        includeInsights: true,
        includeActionableItems: true,
        formatStyle: 'detailed',
        ...options,
      } as Required<MCPFormatterOptions>;

      // Prepare the analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(rawOutput, toolName, opts);

      // Send to AI for analysis and formatting
      const messages = [new SystemMessage(this.SYSTEM_PROMPT), new HumanMessage(analysisPrompt)];

      const response = await this.model.invoke(messages, {
        max_tokens: opts.maxTokens,
      });

      const processingTime = Date.now() - startTime;

      // Parse the AI response
      const formattedOutput = this.parseAIResponse(response.content as string, {
        toolName,
        responseSize: rawOutput.length,
        processingTime,
      });

      return formattedOutput;
    } catch (error) {
      console.error('Error formatting MCP output:', error);

      // Fallback to basic formatting
      return this.createFallbackFormat(rawOutput, toolName, Date.now() - startTime);
    }
  }

  /**
   * Build the analysis prompt for the AI
   */
  private buildAnalysisPrompt(
    rawOutput: string,
    toolName: string,
    options: Required<MCPFormatterOptions>
  ): string {
    const truncatedOutput = this.truncateIfNeeded(rawOutput, 10000); // Limit to ~10k chars

    // Detect if this is likely an error
    const isError = this.detectError(rawOutput);
    const errorHint = isError
      ? '\n\nIMPORTANT: This appears to be an error response. Use "error" type and provide helpful troubleshooting guidance.'
      : '';

    return `Analyze and format this ${toolName} tool output:

TOOL: ${toolName}
RAW OUTPUT:
${truncatedOutput}

FORMAT STYLE: ${options.formatStyle}
INCLUDE INSIGHTS: ${options.includeInsights}
INCLUDE ACTIONABLE ITEMS: ${options.includeActionableItems}

Please analyze this data and respond with properly formatted JSON following the schema.
Pay special attention to:
1. Identifying the most appropriate visualization type (or "error" if this is an error)
2. For errors: Provide clear, actionable troubleshooting steps
3. For data: Extract key metrics and patterns
4. Highlighting any security or performance issues
5. Providing actionable recommendations

${errorHint}

${
  truncatedOutput.length < rawOutput.length
    ? `\n[Note: Output was truncated from ${rawOutput.length} to ${truncatedOutput.length} characters for analysis]`
    : ''
}`;
  }

  /**
   * Detect if raw output indicates an error
   */
  private detectError(rawOutput: string): boolean {
    try {
      const parsed = JSON.parse(rawOutput);
      return (
        parsed.success === false ||
        parsed.error === true ||
        (typeof parsed.error === 'string' && parsed.error.length > 0) ||
        rawOutput.toLowerCase().includes('schema mismatch')
      );
    } catch {
      const lower = rawOutput.toLowerCase();
      return (
        lower.includes('error') ||
        lower.includes('failed') ||
        lower.includes('exception') ||
        lower.includes('schema mismatch')
      );
    }
  }

  /**
   * Parse AI response and validate structure
   */
  private parseAIResponse(
    aiResponse: string,
    metadata: { toolName: string; responseSize: number; processingTime: number }
  ): FormattedMCPOutput {
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch =
        aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // Validate required fields and add metadata
      const formatted: FormattedMCPOutput = {
        type: parsed.type || 'text',
        title: parsed.title || `${metadata.toolName} Output`,
        summary: parsed.summary || 'Analysis completed',
        data: parsed.data || { content: aiResponse },
        insights: parsed.insights || [],
        warnings: parsed.warnings || [],
        actionable_items: parsed.actionable_items || [],
        metadata: {
          ...metadata,
          dataPoints: this.estimateDataPoints(parsed.data),
        },
      };

      return formatted;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Create fallback formatting when AI processing fails
   */
  private createFallbackFormat(
    rawOutput: string,
    toolName: string,
    processingTime: number
  ): FormattedMCPOutput {
    // Try to detect if it's JSON
    let data: any;
    let type: FormattedMCPOutput['type'] = 'text';

    try {
      const parsed = JSON.parse(rawOutput);

      if (Array.isArray(parsed)) {
        type = 'list';
        data = {
          items: parsed.slice(0, 100).map((item, index) => ({
            text: typeof item === 'string' ? item : JSON.stringify(item),
            status: 'normal',
            metadata: `Item ${index + 1}`,
          })),
        };
      } else if (typeof parsed === 'object') {
        type = 'text';
        data = {
          content: JSON.stringify(parsed, null, 2),
          language: 'json',
        };
      } else {
        type = 'text';
        data = { content: String(parsed) };
      }
    } catch {
      // Not JSON, treat as text
      type = 'text';
      data = {
        content:
          rawOutput.length > 5000
            ? rawOutput.substring(0, 5000) + '\n\n[Output truncated...]'
            : rawOutput,
        language: 'text',
      };
    }

    return {
      type,
      title: `${toolName} Output`,
      summary: `Raw output from ${toolName}. AI formatting was not available.`,
      data,
      insights: [],
      warnings: ['AI formatting failed - showing raw output'],
      actionable_items: ['Consider checking the AI service connection'],
      metadata: {
        toolName,
        responseSize: rawOutput.length,
        processingTime,
        dataPoints: this.estimateDataPoints(data),
      },
    };
  }

  /**
   * Truncate output if too large for AI processing
   */
  private truncateIfNeeded(output: string, maxLength: number): string {
    if (output.length <= maxLength) {
      return output;
    }

    // Try to truncate at a reasonable boundary
    const truncated = output.substring(0, maxLength);
    const lastNewline = truncated.lastIndexOf('\n');
    const lastBrace = truncated.lastIndexOf('}');
    const lastBracket = truncated.lastIndexOf(']');

    // Use the best boundary we can find
    const cutPoint = Math.max(lastNewline, lastBrace, lastBracket);

    return cutPoint > maxLength * 0.8 ? output.substring(0, cutPoint) : truncated;
  }

  /**
   * Estimate number of data points in the formatted data
   */
  private estimateDataPoints(data: any): number {
    if (!data) return 0;

    if (Array.isArray(data)) {
      return data.length;
    }

    if (data.rows && Array.isArray(data.rows)) {
      return data.rows.length;
    }

    if (data.items && Array.isArray(data.items)) {
      return data.items.length;
    }

    if (data.primary && Array.isArray(data.primary)) {
      return data.primary.length + (data.secondary?.length || 0);
    }

    if (typeof data === 'object') {
      return Object.keys(data).length;
    }

    return 1;
  }

  /**
   * Quick format for simple cases without AI processing
   */
  formatSimple(rawOutput: string, toolName: string): FormattedMCPOutput {
    return this.createFallbackFormat(rawOutput, toolName, 0);
  }
}
