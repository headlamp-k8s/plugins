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

import { describe, expect, it } from 'vitest';
import { parseDuration } from './parseDuration';

describe('parseDuration', () => {
  // ── Single units ──────────────────────────────────────────────────────────
  describe('single time unit', () => {
    it('converts 1h to 3 600 000 ms', () => {
      expect(parseDuration('1h')).toBe(3_600_000);
    });

    it('converts 2h to 7 200 000 ms', () => {
      expect(parseDuration('2h')).toBe(7_200_000);
    });

    it('converts 30m to 1 800 000 ms', () => {
      expect(parseDuration('30m')).toBe(1_800_000);
    });

    it('converts 1m to 60 000 ms', () => {
      expect(parseDuration('1m')).toBe(60_000);
    });

    it('converts 45s to 45 000 ms', () => {
      expect(parseDuration('45s')).toBe(45_000);
    });

    it('converts 1s to 1 000 ms', () => {
      expect(parseDuration('1s')).toBe(1_000);
    });

    it('converts 0s to 0 ms', () => {
      expect(parseDuration('0s')).toBe(0);
    });
  });

  // ── Combined units ────────────────────────────────────────────────────────
  describe('combined time units', () => {
    it('converts 1h30m to 5 400 000 ms', () => {
      expect(parseDuration('1h30m')).toBe(5_400_000);
    });

    it('converts 5m30s to 330 000 ms', () => {
      expect(parseDuration('5m30s')).toBe(330_000);
    });

    it('converts 1h30m45s to 5 445 000 ms', () => {
      expect(parseDuration('1h30m45s')).toBe(5_445_000);
    });

    it('converts 2h5m to 7 500 000 ms', () => {
      expect(parseDuration('2h5m')).toBe(7_500_000);
    });
  });

  // ── Typical Flux reconciliation intervals ─────────────────────────────────
  describe('typical Flux reconciliation intervals', () => {
    it('parses 10m (common default interval)', () => {
      expect(parseDuration('10m')).toBe(600_000);
    });

    it('parses 1h (common sync interval)', () => {
      expect(parseDuration('1h')).toBe(3_600_000);
    });

    it('parses 5m (common retry interval)', () => {
      expect(parseDuration('5m')).toBe(300_000);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('returns 0 for an empty string', () => {
      expect(parseDuration('')).toBe(0);
    });

    it('returns 0 for a string with no recognisable units', () => {
      expect(parseDuration('invalid')).toBe(0);
    });
  });
});
