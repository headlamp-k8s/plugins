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
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { redactSecrets } from '../../security/redactSecrets';
import type { FormattedMCPData, FormattedMCPOutput } from '../tools/formattedOutput';

/** Options that control how MCP output is formatted. */
export interface MCPFormatterOptions {
  /** Maximum token budget to use when formatting the output. */
  maxTokens?: number;
  /** Whether the formatted result should include insights. */
  includeInsights?: boolean;
  /** Whether the formatted result should include actionable items. */
  includeActionableItems?: boolean;
  /** Desired level of detail for the formatted output. */
  formatStyle?: 'detailed' | 'compact' | 'minimal';
}

/** Formats raw MCP tool output into a user-friendly structured response. */
export class MCPOutputFormatter {
  private model: BaseChatModel;
  /** Instructions and response schema supplied to the formatting model. */
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
    "responseSize": "Size in JavaScript string characters",
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

Remember: Focus on making complex data accessible and actionable for Kubernetes operators and developers.`;

  /**
   * Creates an output formatter backed by the provided chat model.
   *
   * @param model - Chat model used for structured output analysis.
   */
  constructor(model: BaseChatModel) {
    this.model = model;
  }

  /**
   * Formats MCP tool output using model analysis with a deterministic fallback.
   *
   * Secrets are redacted before model or fallback processing. Model failures
   * and invalid structured responses return fallback output rather than throw.
   *
   * @param rawOutput - Raw MCP output, which may contain sensitive values.
   * @param toolName - Tool identifier included in prompts and metadata.
   * @param options - Optional token budget, detail style, and optional sections.
   * @returns Structured formatted output from model analysis or fallback formatting.
   */
  async formatMCPOutput(
    rawOutput: string,
    toolName: string,
    options: MCPFormatterOptions = {}
  ): Promise<FormattedMCPOutput> {
    const startTime = Date.now();

    try {
      // Redact secrets before any LLM processing so credentials, tokens, and
      // kubeconfig data are never sent to the model.
      const safeOutput = redactSecrets(rawOutput);

      // Prepare options with defaults.
      // maxTokens intentionally has no default here — if omitted, the model's
      // own token limit is used (see the bind logic below).
      const opts = {
        includeInsights: true,
        includeActionableItems: true,
        formatStyle: 'detailed',
        ...options,
      } as Required<MCPFormatterOptions>;

      // Prepare the analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(safeOutput, toolName, opts);

      // Send to AI for analysis and formatting
      const messages = [new SystemMessage(this.SYSTEM_PROMPT), new HumanMessage(analysisPrompt)];

      // Pass max_tokens through model.bind so the token budget is actually enforced.
      // Using bind keeps the invoker side clean and works across all BaseChatModel
      // implementations that honour the standard max_tokens/maxTokens kwarg.
      // The cast is required because BaseChatModel's bind() typing is not exposed
      // through the abstract type; the runtime method exists on all LangChain models.
      // Only bind when the caller explicitly sets maxTokens; do not bind for the
      // default so the model's own default token limit is respected.
      // Bind both spellings: snake_case (OpenAI/Anthropic) and camelCase
      // (some LangChain providers) so the budget is enforced regardless of provider.
      const modelWithConfig =
        options.maxTokens !== undefined
          ? (
              this.model as BaseChatModel & {
                /**
                 * Creates a model variant with invocation options applied.
                 *
                 * @param options - Provider-compatible invocation options.
                 * @returns A model-like object that can invoke messages.
                 */
                bind(options: Record<string, unknown>): Pick<BaseChatModel, 'invoke'>;
              }
            ).bind({
              max_tokens: options.maxTokens,
              maxTokens: options.maxTokens,
            })
          : this.model;

      const response = await modelWithConfig.invoke(messages);

      const processingTime = Date.now() - startTime;

      // Parse the AI response — content can be a string or an array of parts
      const raw = response.content;
      const contentStr =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
          ? raw
              .map(content => {
                if (typeof content === 'string') return content;
                if (
                  typeof content === 'object' &&
                  content !== null &&
                  'text' in content &&
                  typeof content.text === 'string'
                ) {
                  return content.text;
                }
                return '';
              })
              .join('')
          : String(raw);
      const formattedOutput = this.parseAIResponse(contentStr, {
        toolName,
        responseSize: rawOutput.length,
        processingTime,
      });

      return formattedOutput;
    } catch (error) {
      console.error('Error formatting MCP output:', error);

      // Fallback to basic formatting
      return this.createFallbackFormat(redactSecrets(rawOutput), toolName, Date.now() - startTime);
    }
  }

  /**
   * Builds the user prompt for structured model analysis.
   *
   * Documentation-like content receives a larger character limit and markdown
   * guidance; error-like content receives troubleshooting guidance.
   *
   * @param rawOutput - Redacted raw output to analyze.
   * @param toolName - Tool identifier included in the prompt.
   * @param options - Fully resolved formatting options.
   * @returns Analysis prompt containing bounded output and formatting guidance.
   */
  private buildAnalysisPrompt(
    rawOutput: string,
    toolName: string,
    options: Required<MCPFormatterOptions>
  ): string {
    // Detect if this is documentation content
    const isDocumentation = this.isDocumentationContent(rawOutput, toolName);

    // Use higher limits for documentation content
    const maxLength = isDocumentation ? 25000 : 10000;
    const truncatedOutput = this.truncateIfNeeded(rawOutput, maxLength);

    // Detect if this is likely an error
    const isError = this.detectError(rawOutput);
    const errorHint = isError
      ? '\n\nIMPORTANT: This appears to be an error response. Use "error" type and provide helpful troubleshooting guidance.'
      : '';

    const docHint = isDocumentation
      ? '\n\nIMPORTANT: This appears to be documentation content. Use "text" type with language="markdown" to enable proper markdown rendering.'
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
4. For documentation: Use markdown formatting and preserve structure
5. Highlighting any security or performance issues
6. Providing actionable recommendations

${errorHint}${docHint}

${
  truncatedOutput.length < rawOutput.length
    ? `\n[Note: Output was truncated from ${rawOutput.length} to ${truncatedOutput.length} characters for analysis. Original content size: ${rawOutput.length} characters]`
    : ''
}`;
  }

  /**
   * Detects whether raw output indicates an error.
   *
   * @param rawOutput - JSON or plain text output to inspect.
   * @returns Whether structured flags or error-related text indicate failure.
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
   * Detects documentation content using tool-name, markdown, size, and keyword heuristics.
   *
   * @param rawOutput - Tool output to inspect for documentation structure.
   * @param toolName - Tool identifier to inspect for documentation keywords.
   * @returns Whether the output should receive documentation-specific limits and rendering.
   */
  private isDocumentationContent(rawOutput: string, toolName: string): boolean {
    // Check tool name patterns
    const docToolPatterns = [
      'documentation',
      'docs',
      'fetch',
      'microsoft',
      'azure',
      'guide',
      'tutorial',
      'manual',
      'readme',
    ];

    const toolNameLower = toolName.toLowerCase();
    const isDocTool = docToolPatterns.some(pattern => toolNameLower.includes(pattern));

    // Check content patterns
    const docContentPatterns = [
      /^#{1,6}\s+/m, // Markdown headers
      /```[\s\S]*?```/, // Code blocks
      /\[.*?\]\(.*?\)/, // Markdown links
      /^\s*[-*+]\s+/m, // Lists
      /^\s*\d+\.\s+/m, // Numbered lists
      /^\s*>\s+/m, // Blockquotes
      /\*\*[^*]+\*\*/, // Bold text
      /\*[^*]+\*/, // Italic text
      /`[^`]+`/, // Inline code
    ];

    const contentMatches = docContentPatterns.filter(pattern => pattern.test(rawOutput)).length;

    // Check for common documentation keywords
    const docKeywords = [
      'prerequisites',
      'installation',
      'configuration',
      'getting started',
      'tutorial',
      'example',
      'usage',
      'overview',
      'introduction',
      'documentation',
      'azure',
      'microsoft',
      'learn.microsoft.com',
    ];

    const contentLower = rawOutput.toLowerCase();
    const keywordMatches = docKeywords.filter(keyword => contentLower.includes(keyword)).length;

    // Consider it documentation if:
    // 1. Tool name suggests documentation OR
    // 2. Multiple markdown patterns + documentation keywords OR
    // 3. Very large content with some doc patterns (likely fetched docs)
    return (
      isDocTool ||
      (contentMatches >= 3 && keywordMatches >= 2) ||
      (rawOutput.length > 20000 && contentMatches >= 2)
    );
  }

  /**
   * Parses a model response and fills required formatted-output fields.
   *
   * JSON may be wrapped in a markdown fence or embedded directly. Non-object
   * `data` values are wrapped as text content.
   *
   * @param aiResponse - Raw model response expected to contain JSON.
   * @param metadata - Tool and processing diagnostics attached to the result.
   * @returns Structured output with defaults and estimated data-point metadata.
   * @throws When no JSON object can be extracted or parsed.
   */
  private parseAIResponse(
    aiResponse: string,
    metadata: {
      /** Tool that produced the raw output. */
      toolName: string;
      /** Raw output length in JavaScript string characters. */
      responseSize: number;
      /** Elapsed formatting time in milliseconds. */
      processingTime: number;
    }
  ): FormattedMCPOutput {
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch =
        aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const parsedData: FormattedMCPData =
        typeof parsed.data === 'object' && parsed.data !== null && !Array.isArray(parsed.data)
          ? parsed.data
          : { content: String(parsed.data ?? aiResponse) };

      // Validate required fields and add metadata
      const formatted: FormattedMCPOutput = {
        type: parsed.type || 'text',
        title: parsed.title || `${metadata.toolName} Output`,
        summary: parsed.summary || 'Analysis completed',
        data: parsedData,
        insights: parsed.insights || [],
        warnings: parsed.warnings || [],
        actionable_items: parsed.actionable_items || [],
        metadata: {
          ...metadata,
          dataPoints: this.estimateDataPoints(parsedData),
        },
      };

      return formatted;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Creates fallback formatting when model processing fails or is skipped.
   *
   * JSON arrays become lists, JSON objects become formatted JSON text, and
   * plain text is truncated with documentation-aware limits when necessary.
   *
   * @param rawOutput - Redacted raw output to format locally.
   * @param toolName - Tool identifier used in titles and metadata.
   * @param processingTime - Elapsed processing time in milliseconds.
   * @returns Structured output marked with an AI-formatting warning.
   */
  private createFallbackFormat(
    rawOutput: string,
    toolName: string,
    processingTime: number
  ): FormattedMCPOutput {
    // Try to detect if it's JSON
    let data: FormattedMCPData;
    let type: FormattedMCPOutput['type'] = 'text';
    const warnings: string[] = ['AI formatting failed - showing raw output'];

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

      // Check if this is documentation content
      const isDocumentation = this.isDocumentationContent(rawOutput, toolName);

      // Use higher limits for documentation
      const maxLength = isDocumentation ? 15000 : 5000;

      if (rawOutput.length > maxLength) {
        const truncatedContent = rawOutput.substring(0, maxLength);
        warnings.push(`Content truncated from ${rawOutput.length} to ${maxLength} characters`);

        data = {
          content:
            truncatedContent +
            '\n\n[Content truncated for display. Original size: ' +
            rawOutput.length +
            ' characters]',
          language: isDocumentation ? 'markdown' : 'text',
        };
      } else {
        data = {
          content: rawOutput,
          language: isDocumentation ? 'markdown' : 'text',
        };
      }
    }

    return {
      type,
      title: `${toolName} Output`,
      summary: `Raw output from ${toolName}. AI formatting was not available.`,
      data,
      insights: [],
      warnings,
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
   * Truncates output when it exceeds a character limit.
   *
   * The furthest newline, closing brace, or closing bracket in the final 20%
   * of the candidate prefix is used when available.
   *
   * @param output - Text to bound for analysis.
   * @param maxLength - Maximum number of JavaScript string characters.
   * @returns Original text or a bounded prefix ending at a nearby structural boundary.
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
   * Estimates the number of logical data points in formatted output.
   *
   * @param data - Structured or primitive formatted data to count.
   * @returns Array length, known collection length, object key count, `1` for a primitive, or `0` for no data.
   */
  private estimateDataPoints(data: unknown): number {
    if (!data) return 0;

    if (Array.isArray(data)) {
      return data.length;
    }

    if (typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record.rows)) return record.rows.length;
      if (Array.isArray(record.items)) return record.items.length;
      if (Array.isArray(record.primary)) {
        return (
          record.primary.length + (Array.isArray(record.secondary) ? record.secondary.length : 0)
        );
      }
      return Object.keys(record).length;
    }

    return 1;
  }

  /**
   * Formats simple output locally without invoking the model.
   *
   * @param rawOutput - Raw output to redact and format.
   * @param toolName - Tool identifier used in titles and metadata.
   * @returns Redacted fallback-formatted output with zero processing time.
   */
  formatSimple(rawOutput: string, toolName: string): FormattedMCPOutput {
    return this.createFallbackFormat(redactSecrets(rawOutput), toolName, 0);
  }
}
