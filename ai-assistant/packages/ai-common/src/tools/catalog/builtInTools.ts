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

import { KubernetesTool } from '../kubernetes/langchain/KubernetesTool';
import type { LangChainTool } from '../langchain/LangChainTool';

/** Constructors for all built-in tools available to the assistant. */
export const AVAILABLE_TOOLS: Array<new () => LangChainTool> = [KubernetesTool];

/**
 * Finds a configured tool instance by name.
 *
 * @param name - Tool identifier to find.
 * @param tools - Configured tool instances to search.
 * @returns The first matching tool, or `undefined` when no tool matches.
 */
export function getToolByName(name: string, tools: LangChainTool[]): LangChainTool | undefined {
  return tools.find(tool => tool.config.name === name);
}
