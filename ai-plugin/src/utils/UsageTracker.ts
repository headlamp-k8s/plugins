/**
 * Simple utility to track API usage to help monitor costs
 */
export class UsageTracker {
  private static instance: UsageTracker;
  private tokenCount: number = 0;
  private requestCount: number = 0;
  private toolCallCount: number = 0;
  private sessionStartTime: Date = new Date();
  private modelUsed: string = 'unknown';

  private constructor() {}

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  public resetSession(model: string): void {
    this.tokenCount = 0;
    this.requestCount = 0;
    this.toolCallCount = 0;
    this.sessionStartTime = new Date();
    this.modelUsed = model;
  }

  public trackRequest(inputTokens: number, outputTokens: number): void {
    this.tokenCount += inputTokens + outputTokens;
    this.requestCount++;
  }

  public trackToolCall(): void {
    this.toolCallCount++;
  }

  public getUsageSummary(): {
    requestCount: number;
    tokenCount: number;
    toolCallCount: number;
    sessionDuration: number;
    modelUsed: string;
  } {
    const sessionDuration = (new Date().getTime() - this.sessionStartTime.getTime()) / 1000;
    return {
      requestCount: this.requestCount,
      tokenCount: this.tokenCount,
      toolCallCount: this.toolCallCount,
      sessionDuration,
      modelUsed: this.modelUsed,
    };
  }

  // Estimate cost based on model and token count
  // This is a rough estimate and should be adjusted based on actual pricing
  public estimateCost(): number {
    // Base pricing per 1K tokens (very rough estimates)
    const pricingPerModel: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      default: { input: 0.01, output: 0.03 },
    };

    // Use default pricing if model not found
    const pricing = pricingPerModel[this.modelUsed.toLowerCase()] || pricingPerModel.default;

    // Assume 50/50 split between input and output tokens
    const inputTokens = this.tokenCount * 0.5;
    const outputTokens = this.tokenCount * 0.5;

    // Calculate cost in USD
    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    return parseFloat(cost.toFixed(4));
  }
}

export default UsageTracker;
