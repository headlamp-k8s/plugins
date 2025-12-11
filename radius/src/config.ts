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

import { DEFAULT_UCP_API_VERSION, PLUGIN_NAME } from './index';

/**
 * Interface for plugin settings stored in localStorage
 */
interface RadiusPluginSettings {
  ucpApiVersion?: string;
}

/**
 * Get the configured UCP API version from plugin settings
 * Falls back to the default version if not configured
 *
 * @returns The UCP API version string
 */
export function getUCPApiVersion(): string {
  try {
    const settingsKey = `plugin.settings.${PLUGIN_NAME}`;
    const settingsJson = localStorage.getItem(settingsKey);

    if (settingsJson) {
      const settings: RadiusPluginSettings = JSON.parse(settingsJson);
      if (settings.ucpApiVersion) {
        return settings.ucpApiVersion;
      }
    }
  } catch (error) {
    console.warn('Failed to load Radius plugin settings, using default API version:', error);
  }

  return DEFAULT_UCP_API_VERSION;
}
