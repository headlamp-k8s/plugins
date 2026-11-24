/*
 * Copyright 2026 The Kubernetes Authors
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

import type { NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { toYaml } from '../../resources/knative/eventingData';
import { ReadOnlyYaml } from './ReadOnlyYaml';

/**
 * Builds the detail row that shows the settings of an object's own kind, as read-only YAML.
 *
 * @param kind - The object's kind, such as `KafkaChannel`.
 * @param settings - The settings, as written.
 * @returns The row, hidden when there are no settings.
 */
export function getSettingsRow(
  kind: string,
  settings: Record<string, unknown> | undefined
): NameValueTableRow {
  return {
    name: 'Settings',
    value: settings && (
      <ReadOnlyYaml value={toYaml(settings)} ariaLabel={`${kind} settings YAML`} />
    ),
    valueFullRow: true,
    hide: !settings,
  };
}
