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

/**
 * Maps an Argo CD health status string to a Headlamp StatusLabel severity.
 *
 * @param health - The health status string from the Application resource
 *   (e.g., "Healthy", "Degraded", "Progressing", "Suspended", "Missing").
 * @returns A StatusLabel status string: "success", "warning", "info", "error",
 *   or "" for unknown values.
 */
export function getHealthStatus(health: string): string {
  switch (health.toLowerCase()) {
    case 'healthy':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'progressing':
      return 'info';
    case 'degraded':
    case 'missing':
      return 'error';
    default:
      return '';
  }
}

/**
 * Maps an Argo CD sync status string to a Headlamp StatusLabel severity.
 *
 * @param sync - The sync status string from the Application resource
 *   (e.g., "Synced", "OutOfSync").
 * @returns A StatusLabel status string: "success", "warning",
 *   or "" for unknown values.
 */
export function getSyncStatus(sync: string): string {
  switch (sync.toLowerCase()) {
    case 'synced':
      return 'success';
    case 'outofsync':
      return 'warning';
    default:
      return '';
  }
}
