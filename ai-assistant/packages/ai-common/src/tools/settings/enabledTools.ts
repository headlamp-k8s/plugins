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

import { getAllAvailableTools } from '../catalog/toolDefinitions';

export type PluginToolSettings = Record<string, unknown>;

/**
 * Normalizes persisted plugin data to an object-shaped settings value.
 *
 * @param value - Persisted value to validate.
 * @returns The object value, or an empty object for null and primitive values.
 */
function asPluginSettings(value: unknown): PluginToolSettings {
  return value !== null && typeof value === 'object' ? (value as PluginToolSettings) : {};
}

/**
 * Returns whether a tool is enabled by persisted plugin settings.
 *
 * @param pluginSettings - Persisted settings using a map, string array, or missing value.
 * @param toolId - Tool identifier to check.
 * @returns Array membership, explicit map state, or `true` by default.
 */
export function isToolEnabled(pluginSettings: unknown, toolId: string): boolean {
  const enabledTools = asPluginSettings(pluginSettings).enabledTools;
  if (!enabledTools || typeof enabledTools !== 'object') return true;
  if (Array.isArray(enabledTools)) return enabledTools.includes(toolId);
  if (Object.prototype.hasOwnProperty.call(enabledTools, toolId)) {
    return Boolean((enabledTools as Record<string, unknown>)[toolId]);
  }
  return true;
}

/**
 * Toggles a tool while preserving the persisted settings shape.
 *
 * @param pluginSettings - Persisted settings to copy and update.
 * @param toolId - Tool identifier whose enabled state should be inverted.
 * @returns New settings with an updated array or map value.
 */
export function toggleTool(pluginSettings: unknown, toolId: string): PluginToolSettings {
  const settings = asPluginSettings(pluginSettings);
  const enabled = !isToolEnabled(settings, toolId);
  if (Array.isArray(settings.enabledTools)) {
    const enabledTools: string[] = enabled
      ? [...settings.enabledTools, toolId]
      : settings.enabledTools.filter((id): id is string => typeof id === 'string' && id !== toolId);
    return { ...settings, enabledTools };
  }
  const existingEnabledTools =
    settings.enabledTools !== null &&
    settings.enabledTools !== undefined &&
    typeof settings.enabledTools === 'object'
      ? settings.enabledTools
      : {};
  return {
    ...settings,
    enabledTools: { ...existingEnabledTools, [toolId]: enabled },
  };
}

/**
 * Returns enabled built-in tool identifiers.
 *
 * @param pluginSettings - Persisted settings used to filter the built-in catalog.
 * @returns Built-in tool identifiers currently considered enabled.
 */
export function getEnabledToolIds(pluginSettings: unknown): string[] {
  return getAllAvailableTools()
    .map(tool => tool.id)
    .filter(toolId => isToolEnabled(pluginSettings, toolId));
}

/**
 * Stores enabled built-in tools while preserving the persisted settings shape.
 *
 * @param pluginSettings - Persisted settings to copy and update.
 * @param enabledToolIds - Built-in identifiers that should remain enabled.
 * @returns New settings using the existing array format or a complete boolean map.
 */
export function setEnabledTools(
  pluginSettings: unknown,
  enabledToolIds: string[]
): PluginToolSettings {
  const settings = asPluginSettings(pluginSettings);
  if (Array.isArray(settings.enabledTools)) {
    return { ...settings, enabledTools: enabledToolIds };
  }
  const enabledTools: Record<string, boolean> = {};
  for (const tool of getAllAvailableTools()) {
    enabledTools[tool.id] = enabledToolIds.includes(tool.id);
  }
  return { ...settings, enabledTools };
}
