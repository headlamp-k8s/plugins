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

import type { DeploymentTrigger } from '../types/pipecd';
import type { Translate } from './time';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TriggeredBy {
  label: string;
  /** Set when the label hides a value worth seeing on hover. */
  detail?: string;
}

/**
 * Describes who started a deployment.
 *
 * PipeCD puts the API key's id in `commander` when a sync is triggered with an
 * API key, which reads as a meaningless UUID in the UI. Show that it was a key
 * rather than a person, and keep the id available on hover. Falls back to the
 * commit author for deployments triggered by a Git push.
 */
export function triggeredBy(trigger: DeploymentTrigger | undefined, t: Translate): TriggeredBy {
  const commander = trigger?.commander?.trim();
  if (commander) {
    return UUID.test(commander) ? { label: t('API key'), detail: commander } : { label: commander };
  }

  const author = trigger?.commit?.author?.trim();
  return author ? { label: author } : { label: '—' };
}
