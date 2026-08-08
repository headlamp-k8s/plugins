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

import type { KService } from '../resources/knative/kservice';
import type { KRevision } from '../resources/knative/revision';

/**
 * Evaluates whether a Knative Service or Revision is currently scaled to zero (idle).
 *
 * In Knative Serving, a service or revision scales to zero when it has no active pod replicas:
 * 1. The 'Active' condition has status === 'False' (e.g. reason 'NoTraffic' or 'TimedOut').
 * 2. status.actualReplicas === 0 or status.desiredReplicas === 0 while readyCondition.status === 'True'.
 */
export function isScaledToZero(item: KService | KRevision | null | undefined): boolean {
  if (!item || !item.status) {
    return false;
  }

  const conditions = item.status.conditions || [];
  const readyCond = conditions.find(c => c.type === 'Ready');
  if (readyCond?.status !== 'True') {
    return false;
  }

  // Check Active condition (KPA sets Active=False with reason NoTraffic/TimedOut when idle)
  const activeCond = conditions.find(c => c.type === 'Active');
  if (activeCond && activeCond.status === 'False') {
    return true;
  }

  // Check actual / desired replica counts if present in status
  const statusAny = item.status as any;
  if (typeof statusAny?.actualReplicas === 'number' && statusAny.actualReplicas === 0) {
    return true;
  }
  if (typeof statusAny?.desiredReplicas === 'number' && statusAny.desiredReplicas === 0) {
    return true;
  }

  return false;
}
