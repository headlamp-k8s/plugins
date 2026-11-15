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

import type { Traffic } from '../resources/knative';

export function formatList(values: Array<string | undefined> | undefined): string {
  const presentValues = (values || []).filter((value): value is string => Boolean(value));
  return presentValues.length > 0 ? presentValues.join(', ') : '-';
}

export function formatTraffic(traffic: Traffic[] | undefined): string {
  if (!traffic?.length) return '-';

  return traffic
    .map(target => {
      const destination =
        target.revisionName ||
        target.configurationName ||
        (target.latestRevision ? 'latest revision' : 'unresolved target');
      const tag = target.tag ? ` (tag: ${target.tag})` : '';
      return `${target.percent ?? 0}% ${destination}${tag}`;
    })
    .join(', ');
}

export function formatNanoseconds(value: number | undefined): string {
  return value === undefined ? '-' : `${value / 1_000_000_000}s`;
}
