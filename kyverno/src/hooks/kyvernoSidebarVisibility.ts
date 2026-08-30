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

import { CRDGroup } from '../components/CRDGuard';
import { KyvernoCRDStatus } from './useKyvernoCRDs';

/**
 * Decides whether a Kyverno sidebar entry should be hidden for the current
 * cluster.
 *
 * Kept SDK-free (no Headlamp imports) so it can be unit-tested without the
 * host shim, same as bucketReportResults in policyResultBucket.ts.
 *
 * We only hide once the probe has actually resolved. While it's still
 * loading, or hasn't run for this cluster yet, the entry stays visible —
 * hiding on missing data would flash every entry away for a moment on
 * every cluster switch.
 */
export function shouldHideSidebarEntry(
  status: KyvernoCRDStatus | undefined,
  requires: CRDGroup
): boolean {
  return !!status && !status.loading && !status[requires];
}
