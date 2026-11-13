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

import type { KnativeTrigger } from '../../resources/knative';
import { formatTriggerFilter } from '../../resources/knative/eventingData';
import { ReadOnlyYaml } from '../common/ReadOnlyYaml';

/**
 * Shows the active Trigger filter as read-only, syntax-highlighted YAML.
 *
 * @param props - The Trigger spec whose filter is shown.
 * @returns The filter as YAML, or `All events` when the Trigger filters nothing.
 */
export function TriggerFilter({
  spec,
}: {
  /** The Trigger's spec, which holds `filters` or the older `filter`. */
  spec: KnativeTrigger['spec'];
}) {
  const value = formatTriggerFilter(spec);

  if (!value) {
    return <>All events</>;
  }

  return <ReadOnlyYaml value={value} ariaLabel="Trigger filter YAML" />;
}
