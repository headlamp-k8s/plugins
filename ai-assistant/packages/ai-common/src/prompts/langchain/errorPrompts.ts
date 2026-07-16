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

/** Explains a failed Kubernetes API request and suggests recovery steps. */
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

/** Reports one or more failed tool operations and suggests recovery steps. */
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
