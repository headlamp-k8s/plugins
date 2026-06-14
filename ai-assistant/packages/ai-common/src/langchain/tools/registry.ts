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

import { KubernetesTool } from './kubernetes/KubernetesTool';
import { ToolBase } from './ToolBase';

/** Constructors for all built-in tools available to the AI assistant. */
export const AVAILABLE_TOOLS: Array<new () => ToolBase> = [
  KubernetesTool, // Main Kubernetes API tool
];

/** Returns the configured tool instance that matches the given name. */
export function getToolByName(name: string, tools: ToolBase[]): ToolBase | undefined {
  return tools.find(tool => tool.config.name === name);
}
