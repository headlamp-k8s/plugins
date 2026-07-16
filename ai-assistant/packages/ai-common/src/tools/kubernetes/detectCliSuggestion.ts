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

const CLI_PATTERNS: ReadonlyArray<RegExp> = [
  /\bkubectl\b/i,
  /run the command/i,
  /\bcommand[- ]line\b/i,
  /\b(?:open|launch|start|access)\b[^.!?]{0,40}\bterminal\b/i,
  /\bin the shell\b/i,
  /\b(?:open|launch|start|run)\b[^.!?]{0,40}\bshell\b/i,
];

/**
 * Checks whether model text recommends CLI use rather than the Kubernetes API tool.
 *
 * @param text - Model-generated text to inspect for CLI-related phrases.
 * @returns Whether any known CLI suggestion pattern appears in the text.
 */
export function containsKubectlSuggestion(text: string): boolean {
  return CLI_PATTERNS.some(pattern => pattern.test(text));
}
