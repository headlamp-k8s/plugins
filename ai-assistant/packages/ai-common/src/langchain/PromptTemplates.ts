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

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';

/**
 * Collection of reusable prompt templates for the AI plugin
 * This helps maintain consistency across different AI interactions
 */

/** Base system prompt used across Kubernetes assistant interactions. */
// @ts-ignore - Complex inferred type cannot be named in declaration
/** Base system prompt used across Kubernetes assistant interactions. */
export const baseSystemPromptTemplate: any = SystemMessagePromptTemplate.fromTemplate(`
You are an AI assistant specialized in Kubernetes management through a web dashboard.
You help users manage their Kubernetes clusters using web UI actions and API tools.

IMPORTANT GUIDELINES:
- NEVER suggest kubectl or command-line tools
- Always use the kubernetes_api_request tool for cluster operations
- Prefer web UI actions when possible
- Be specific about tool parameters and expected outcomes
- Explain technical concepts clearly for users of all skill levels

Current context: {context}
`);

/** Prompt template for troubleshooting Kubernetes issues. */
export const troubleshootingPromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
I'm having an issue with my Kubernetes cluster: {problem}

Please help me troubleshoot this by:
1. Analyzing the problem
2. Suggesting investigation steps using available tools
3. Recommending solutions that don't require command-line access

Format your response as structured JSON with problem analysis, investigation steps, and solutions.
  `),
]);

/** Prompt template for analyzing a specific Kubernetes resource. */
export const resourceAnalysisPromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
Please analyze the Kubernetes resource: {resourceType} named {resourceName} in namespace {namespace}.

Provide a structured analysis including:
- Current status and health
- Any identified issues
- Recommendations for improvement
- Specific tool actions to address problems

Use the kubernetes_api_request tool to gather information and format your response as structured JSON.
  `),
]);

/** Prompt template for reviewing Kubernetes configuration content. */
export const configReviewPromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
Please review the following Kubernetes configuration and provide recommendations:

Configuration Type: {configType}
Configuration Data: {configData}

Analyze the configuration for:
- Security best practices
- Performance optimization
- Resource efficiency
- Maintainability

Provide structured recommendations with priorities and tool actions for implementation.
  `),
]);

/** Prompt template for guiding a user through dashboard-based actions. */
export const userGuidancePromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
The user wants to: {userIntent}

Please guide them on how to accomplish this using:
1. Web UI actions in the dashboard
2. Available API tools
3. Best practices for their use case

Avoid suggesting command-line tools and focus on web-based solutions.
Provide step-by-step guidance that's easy to follow.
  `),
]);

/** Prompt template for explaining user-facing errors. */
export const errorExplanationPromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
The user encountered this error: {errorMessage}

Please explain:
- What this error means in simple terms
- What likely caused it
- How to resolve it using web UI or API tools
- How to prevent it in the future

Keep the explanation beginner-friendly but technically accurate.
  `),
]);

/** Prompt template for explaining failed Kubernetes API requests. */
export const apiErrorPromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
A Kubernetes API request has failed. You must clearly communicate this error to the user.

CRITICAL ERROR HANDLING INSTRUCTIONS:
- ALWAYS acknowledge that an error occurred
- Explain what went wrong in simple terms
- Provide specific next steps the user can take
- Never ignore or downplay errors
- Make the error message prominent and clear

Context: {context}
`),
  HumanMessagePromptTemplate.fromTemplate(`
API Request Failed:
- Method: {method}
- URL: {url}
- Error: {errorMessage}
- Details: {errorDetails}

Please inform the user about this error and provide guidance on how to resolve it.
Format your response to clearly highlight the error and provide actionable solutions.
  `),
]);

/** Prompt template for reporting one or more failed tool operations. */
export const toolFailurePromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
One or more tool operations have failed. You must inform the user about these failures.

INSTRUCTIONS:
- List each failed operation clearly
- Explain the impact of each failure
- Provide recovery steps or alternatives
- Suggest what the user should check or do next

Context: {context}
`),
  HumanMessagePromptTemplate.fromTemplate(`
Failed Operations:
{failedOperations}

Please clearly communicate these failures to the user and provide guidance on next steps.
Use a format that makes the errors easy to understand and act upon.
  `),
]);

/** Prompt template for executing a focused quick action. */
export const quickActionPromptTemplate = ChatPromptTemplate.fromMessages([
  baseSystemPromptTemplate,
  HumanMessagePromptTemplate.fromTemplate(`
Perform this quick action: {action}

Resource: {resource}
Parameters: {parameters}

Execute the action using appropriate tools and provide a clear summary of what was done.
  `),
]);

/** Creates a chat prompt template from custom system and human prompt text. */
export function createCustomPromptTemplate(
  systemPrompt: string,
  humanPrompt: string
): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt),
  ]);
}

/** Prompt template for executing a specific tool-focused action. */
export const toolSpecificPromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
You are executing a specific tool action for Kubernetes management.
Tool: {toolName}
Purpose: {toolPurpose}

Execute the tool action and provide clear feedback about the results.
Include any follow-up actions that might be needed.
  `),
  HumanMessagePromptTemplate.fromTemplate(`
Tool Parameters: {parameters}
User Context: {userContext}

Execute the action and explain the results.
  `),
]);
