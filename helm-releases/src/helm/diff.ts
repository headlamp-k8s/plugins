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

/** Line by line comparison of two texts, used to compare the values of two revisions. */

export type DiffLineKind = 'same' | 'added' | 'removed';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}

/** Unchanged lines hidden between two changes. */
export interface DiffGap {
  kind: 'gap';
  count: number;
}

export type DiffRow = DiffLine | DiffGap;

/** Above this number of cells the comparison table would freeze the page. */
const MAX_TABLE_CELLS = 4_000_000;

function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Compares two texts line by line.
 *
 * The longest common subsequence is only searched between the first and the last changed lines.
 * When that region is too large, it is reported as fully replaced rather than computed.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const left = splitLines(before);
  const right = splitLines(after);

  let start = 0;
  while (start < left.length && start < right.length && left[start] === right[start]) start += 1;

  let leftEnd = left.length;
  let rightEnd = right.length;
  while (leftEnd > start && rightEnd > start && left[leftEnd - 1] === right[rightEnd - 1]) {
    leftEnd -= 1;
    rightEnd -= 1;
  }

  const same = (text: string): DiffLine => ({ kind: 'same', text });
  const removed = (text: string): DiffLine => ({ kind: 'removed', text });
  const added = (text: string): DiffLine => ({ kind: 'added', text });

  const leftMiddle = left.slice(start, leftEnd);
  const rightMiddle = right.slice(start, rightEnd);
  const rows = leftMiddle.length;
  const columns = rightMiddle.length;
  const middle: DiffLine[] = [];

  if (rows * columns > MAX_TABLE_CELLS) {
    middle.push(...leftMiddle.map(removed), ...rightMiddle.map(added));
  } else if (rows > 0 || columns > 0) {
    // lengths[i][j]: longest common subsequence of leftMiddle[i..] and rightMiddle[j..].
    const width = columns + 1;
    const lengths = new Uint32Array((rows + 1) * width);
    for (let i = rows - 1; i >= 0; i -= 1) {
      for (let j = columns - 1; j >= 0; j -= 1) {
        lengths[i * width + j] =
          leftMiddle[i] === rightMiddle[j]
            ? lengths[(i + 1) * width + j + 1] + 1
            : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
      }
    }

    let i = 0;
    let j = 0;
    while (i < rows && j < columns) {
      if (leftMiddle[i] === rightMiddle[j]) {
        middle.push(same(leftMiddle[i]));
        i += 1;
        j += 1;
      } else if (lengths[(i + 1) * width + j] >= lengths[i * width + j + 1]) {
        middle.push(removed(leftMiddle[i]));
        i += 1;
      } else {
        middle.push(added(rightMiddle[j]));
        j += 1;
      }
    }
    while (i < rows) {
      middle.push(removed(leftMiddle[i]));
      i += 1;
    }
    while (j < columns) {
      middle.push(added(rightMiddle[j]));
      j += 1;
    }
  }

  return [...left.slice(0, start).map(same), ...middle, ...left.slice(leftEnd).map(same)];
}

export function hasChanges(lines: DiffLine[]): boolean {
  return lines.some(line => line.kind !== 'same');
}

/** Keeps `context` unchanged lines around each change and folds the others into gaps. */
export function collapseUnchanged(lines: DiffLine[], context: number = 3): DiffRow[] {
  const keep = new Array<boolean>(lines.length).fill(false);
  lines.forEach((line, index) => {
    if (line.kind === 'same') return;
    const from = Math.max(0, index - context);
    const to = Math.min(lines.length - 1, index + context);
    for (let position = from; position <= to; position += 1) keep[position] = true;
  });

  const rows: DiffRow[] = [];
  let hidden = 0;
  lines.forEach((line, index) => {
    if (keep[index]) {
      if (hidden > 0) rows.push({ kind: 'gap', count: hidden });
      hidden = 0;
      rows.push(line);
    } else {
      hidden += 1;
    }
  });
  if (hidden > 0) rows.push({ kind: 'gap', count: hidden });
  return rows;
}
