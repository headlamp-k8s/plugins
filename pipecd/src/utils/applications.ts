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

import { listApplications, type PipeCDConfig } from '../api/pipecd';
import type { Application } from '../types/pipecd';
import { REQUEST_TIMEOUT_MS, withTimeout } from './timeout';

/**
 * A backstop for a broken server that hands out a new cursor forever. With no
 * page size set PipeCD applies no limit, so a real project needs few pages.
 */
export const MAX_APPLICATION_PAGES = 1000;

/**
 * Lists every application by following the cursor. Each request gives up after
 * REQUEST_TIMEOUT_MS with `timedOut` as the error. Ids already collected are
 * skipped, because a page can repeat an application. A page of repeats with a
 * new cursor is still followed, since more applications can come after it.
 * Paging stops when the cursor is empty or comes back a second time, so a
 * server that cycles cursors cannot loop forever.
 */
export async function listAllApplications(
  config: PipeCDConfig,
  options: { disabled?: boolean; signal?: AbortSignal; timedOut: string }
): Promise<Application[]> {
  const seen = new Set<string>();
  const seenCursors = new Set<string>();
  const collected: Application[] = [];
  let cursor = '';
  for (let page = 0; page < MAX_APPLICATION_PAGES; page++) {
    const resp = await withTimeout(
      listApplications(config, {
        cursor: cursor || undefined,
        disabled: options.disabled,
        signal: options.signal,
      }),
      REQUEST_TIMEOUT_MS,
      options.timedOut
    );
    for (const app of resp.applications ?? []) {
      if (seen.has(app.id)) continue;
      seen.add(app.id);
      collected.push(app);
    }
    if (!resp.cursor || seenCursors.has(resp.cursor)) break;
    seenCursors.add(resp.cursor);
    cursor = resp.cursor;
  }
  return collected;
}
