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

/**
 * Joins the two halves of the value below. A control character rather than a
 * space or a dash: neither a phase nor a reason can contain one, so no pair of
 * different states can ever collide into the same string.
 */
const SEPARATOR = '\u0000';

/**
 * Sort key for the Phase column — and, just as importantly, the value Headlamp's
 * table uses to decide whether the cell needs repainting.
 *
 * MemoCell in the table (components/common/Table/Table.tsx) compares
 * `a.cell.getValue() === b.cell.getValue()`, so a cell whose value did not change
 * is never re-rendered no matter how many times the list re-renders around it.
 * The Phase cell renders the phase *and* the operator's `phaseReason` as a
 * tooltip, and CloudNativePG routinely holds a phase steady while rewriting the
 * reason underneath — so keying on the phase alone left the tooltip showing
 * whatever reason happened to be there at first paint. Both fields have to be in
 * the value.
 *
 * The phase stays at the front so the column still sorts by phase, and so the
 * phase is what a search matches first; the reason only breaks ties. An absent
 * and an empty reason are the same rendered state — a bare label, no tooltip —
 * so they deliberately produce the same value rather than repainting for nothing.
 *
 * Takes the already-resolved label (`phase ?? t('Unknown')`) so this stays free
 * of translation concerns.
 */
export function phaseCellValue(label: string, reason: string | null | undefined): string {
  return reason ? `${label}${SEPARATOR}${reason}` : label;
}
