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

import { describe, expect, test } from 'vitest';
import {
  ChartDataPoint,
  hasReliableIncrease,
  PrometheusResponse,
  withGapMarkers,
} from './prometheusQueries';

// Builds the shape an instant query's (`min(count_over_time(...))` or `count(... offset ...)`)
// response takes, with a single scalar-like result value, or no result at all for an absent
// series.
function instantResult(value: number | undefined): PrometheusResponse {
  if (value === undefined) {
    return { status: 'success', data: { result: [] } };
  }
  return { status: 'success', data: { result: [{ value: [0, String(value)] }] } };
}

describe('withGapMarkers', () => {
  const STEP = 30;

  test('leaves consecutive on-step samples untouched, found via Copilot review', () => {
    const data: ChartDataPoint[] = [
      { timestamp: 0, y: 1 },
      { timestamp: 30, y: 2 },
      { timestamp: 60, y: 3 },
    ];

    expect(withGapMarkers(data, STEP)).toEqual(data);
  });

  test('inserts a null point when a gap spans more than one scrape step, found via Copilot review', () => {
    // query_range omits evaluation timestamps entirely for an interval rate() has no result for,
    // rather than returning one with an explicit NaN value, so a sufficiently long outage shows up
    // here as a jump bigger than STEP between two consecutive real samples.
    const data: ChartDataPoint[] = [
      { timestamp: 0, y: 1 },
      { timestamp: 300, y: 2 },
    ];

    expect(withGapMarkers(data, STEP)).toEqual([
      { timestamp: 0, y: 1 },
      { timestamp: 30, y: null },
      { timestamp: 300, y: 2 },
    ]);
  });

  test('does not insert a marker for an existing explicit null sample', () => {
    // histogram_quantile returning NaN for a zero-observation window (already an explicit sample,
    // just a null one) is a different, already-honest case from a missing timestamp, and shouldn't
    // be treated as a gap on top of itself.
    const data: ChartDataPoint[] = [
      { timestamp: 0, y: 1 },
      { timestamp: 30, y: null },
      { timestamp: 60, y: 2 },
    ];

    expect(withGapMarkers(data, STEP)).toEqual(data);
  });

  test('handles empty and single-point series', () => {
    expect(withGapMarkers([], STEP)).toEqual([]);
    expect(withGapMarkers([{ timestamp: 0, y: 1 }], STEP)).toEqual([{ timestamp: 0, y: 1 }]);
  });

  test('inserts a marker for each of several gaps', () => {
    const data: ChartDataPoint[] = [
      { timestamp: 0, y: 1 },
      { timestamp: 300, y: 2 },
      { timestamp: 330, y: 3 },
      { timestamp: 600, y: 4 },
    ];

    expect(withGapMarkers(data, STEP)).toEqual([
      { timestamp: 0, y: 1 },
      { timestamp: 30, y: null },
      { timestamp: 300, y: 2 },
      { timestamp: 330, y: 3 },
      { timestamp: 360, y: null },
      { timestamp: 600, y: 4 },
    ]);
  });
});

describe('hasReliableIncrease', () => {
  test('rejects a newly appearing counter whose first two scrapes both hold the same value, found via Copilot review', () => {
    // Two samples (coverage == 2) is normally considered enough for increase() to produce a
    // value, but a lazily registered series' first two scrapes can both hold its just-created
    // value (e.g. the first denial creates the "request_allowed=false" series at 1, which is
    // still 1 on the next scrape), and increase() over that returns 0, masking a real event.
    // newSeriesRes = 1: the series appears in count_over_time but has no offset counterpart,
    // confirming it is new rather than merely quiet.
    expect(hasReliableIncrease(instantResult(2), instantResult(1), true)).toBe(false);
  });

  test('trusts a series with coverage and a baseline predating the window', () => {
    // newSeriesRes is empty (null): every covered series has an offset counterpart, so none are
    // new, and increase() is reliable.
    expect(hasReliableIncrease(instantResult(2), instantResult(undefined), true)).toBe(true);
  });

  test('rejects when an old series and a new series coexist — mixed old/new regression', () => {
    // Scenario from Copilot review: old quiet denial series (has offset baseline) + new denial
    // series (no offset, two identical-valued scrapes at 1). The old aggregate check
    // count(metric offset window) > 0 would have passed because the old series is there, letting
    // increase() read a confident wrong 0. newSeriesRes = 1 (the new series) correctly rejects.
    expect(hasReliableIncrease(instantResult(2), instantResult(1), true)).toBe(false);
  });

  test('rejects a series with fewer than two samples in the window regardless of new-series count', () => {
    expect(hasReliableIncrease(instantResult(1), instantResult(undefined), true)).toBe(false);
  });

  test('allowAbsent decides whether a totally absent series is trusted as a real zero', () => {
    expect(hasReliableIncrease(instantResult(undefined), instantResult(undefined), true)).toBe(
      true
    );
    expect(hasReliableIncrease(instantResult(undefined), instantResult(undefined), false)).toBe(
      false
    );
  });
});
