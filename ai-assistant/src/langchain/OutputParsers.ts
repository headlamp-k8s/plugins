import {
  CommaSeparatedListOutputParser,
  StringOutputParser,
  StructuredOutputParser,
} from '@langchain/core/output_parsers';
import { z } from 'zod';

/**
 * Collection of structured output parsers for different AI response types
 * This helps ensure consistent, type-safe responses from the AI
 */

// Parser for Kubernetes resource analysis
export const kubernetesAnalysisParser = StructuredOutputParser.fromZodSchema(
  z.object({
    resourceType: z
      .string()
      .describe('Type of Kubernetes resource (e.g., Pod, Service, Deployment)'),
    resourceName: z.string().describe('Name of the resource'),
    namespace: z.string().describe('Namespace of the resource'),
    status: z.enum(['healthy', 'warning', 'error', 'unknown']).describe('Overall status'),
    issues: z.array(z.string()).describe('List of identified issues or problems'),
    recommendations: z.array(z.string()).describe('Recommended actions to take'),
    toolActions: z
      .array(
        z.object({
          action: z.string().describe('Action to perform (get, create, update, delete)'),
          resource: z.string().describe('Resource path for the action'),
          description: z.string().describe('Human-readable description of the action'),
        })
      )
      .describe('Suggested tool actions instead of kubectl commands'),
  })
);

// Parser for troubleshooting responses
export const troubleshootingParser = StructuredOutputParser.fromZodSchema(
  z.object({
    problem: z.string().describe('Description of the identified problem'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level'),
    possibleCauses: z.array(z.string()).describe('List of possible causes'),
    investigationSteps: z
      .array(
        z.object({
          step: z.string().describe('Investigation step description'),
          toolCall: z.string().optional().describe('Tool call to perform this step'),
          expected: z.string().describe('What to expect from this step'),
        })
      )
      .describe('Steps to investigate the problem'),
    solutions: z
      .array(
        z.object({
          solution: z.string().describe('Solution description'),
          toolActions: z.array(z.string()).describe('Tool actions needed for this solution'),
          risks: z.string().optional().describe('Potential risks of this solution'),
        })
      )
      .describe('Possible solutions'),
  })
);

// Parser for resource listing responses
export const resourceListParser = StructuredOutputParser.fromZodSchema(
  z.object({
    resourceType: z.string().describe('Type of resources listed'),
    totalCount: z.number().describe('Total number of resources'),
    resources: z
      .array(
        z.object({
          name: z.string().describe('Resource name'),
          namespace: z.string().optional().describe('Resource namespace if applicable'),
          status: z.string().describe('Current status'),
          age: z.string().describe('Age of the resource'),
          additionalInfo: z
            .record(z.string(), z.string())
            .optional()
            .describe('Additional resource-specific information'),
        })
      )
      .describe('List of resources'),
    summary: z.string().describe('Summary of the resource listing'),
    nextActions: z.array(z.string()).describe('Suggested next actions based on the listing'),
  })
);

// Parser for configuration recommendations
export const configRecommendationParser = StructuredOutputParser.fromZodSchema(
  z.object({
    currentConfig: z.string().describe('Current configuration summary'),
    recommendations: z
      .array(
        z.object({
          category: z.string().describe('Category of recommendation (security, performance, etc.)'),
          recommendation: z.string().describe('The recommendation'),
          rationale: z.string().describe('Why this recommendation is important'),
          toolAction: z
            .string()
            .optional()
            .describe('Tool action to implement this recommendation'),
          priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
        })
      )
      .describe('List of configuration recommendations'),
    overallScore: z.number().min(0).max(100).describe('Overall configuration score (0-100)'),
    summary: z.string().describe('Summary of configuration analysis'),
  })
);

// Simple parsers for common use cases
export const nameListParser = new CommaSeparatedListOutputParser();
export const plainTextParser = new StringOutputParser();

// Parser for command suggestions (to avoid kubectl)
export const actionSuggestionParser = StructuredOutputParser.fromZodSchema(
  z.object({
    userIntent: z.string().describe('What the user is trying to accomplish'),
    webUIActions: z
      .array(
        z.object({
          action: z.string().describe('Action to take in the web UI'),
          location: z.string().describe('Where to find this action in the UI'),
          description: z.string().describe('Detailed description of the action'),
        })
      )
      .describe('Actions that can be taken in the web UI'),
    toolActions: z
      .array(
        z.object({
          toolName: z.string().describe('Name of the tool to use'),
          parameters: z.record(z.string(), z.any()).describe('Parameters for the tool call'),
          description: z.string().describe('What this tool action accomplishes'),
        })
      )
      .describe('Tool actions that can be performed programmatically'),
    explanation: z
      .string()
      .describe('Explanation of why these actions are recommended over command line tools'),
  })
);

/**
 * Utility function to get format instructions for any parser
 */
export function getFormatInstructions(parser: StructuredOutputParser<any>): string {
  return parser.getFormatInstructions();
}

/**
 * Utility function to safely parse responses with error handling
 */
export async function safeParseResponse<T extends z.ZodTypeAny>(
  parser: StructuredOutputParser<T>,
  response: string
): Promise<{ success: boolean; data?: z.infer<T>; error?: string }> {
  try {
    const parsed = await parser.parse(response);
    return { success: true, data: parsed as z.infer<T> };
  } catch (error) {
    console.error('Error parsing structured response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
