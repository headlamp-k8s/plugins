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

import { DateLabel, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { statusSeverity } from '../helm/release';

/** Helm status of a revision, coloured like the other Headlamp statuses. */
export function ReleaseStatus({ status }: { status: string }) {
  return <StatusLabel status={statusSeverity(status)}>{status}</StatusLabel>;
}

/** Date of a deployment; Helm leaves it unset on some records. */
export function ReleaseDate({ date }: { date?: string }) {
  return date ? <DateLabel date={date} format="mini" /> : <>-</>;
}
