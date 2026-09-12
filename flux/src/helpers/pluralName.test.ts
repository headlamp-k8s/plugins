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
import { PluralName } from './pluralName';

describe('PluralName', () => {
  // ── Real Flux CRD kinds ──────────────────────────────────────────────────
  describe('real Flux CRD kinds', () => {
    it('pluralises GitRepository', () => {
      expect(PluralName('GitRepository')).toBe('gitrepositories');
    });

    it('pluralises HelmRepository', () => {
      expect(PluralName('HelmRepository')).toBe('helmrepositories');
    });

    it('pluralises OCIRepository', () => {
      expect(PluralName('OCIRepository')).toBe('ocirepositories');
    });

    it('pluralises HelmChart', () => {
      expect(PluralName('HelmChart')).toBe('helmcharts');
    });

    it('pluralises HelmRelease', () => {
      expect(PluralName('HelmRelease')).toBe('helmreleases');
    });

    it('pluralises Kustomization', () => {
      expect(PluralName('Kustomization')).toBe('kustomizations');
    });

    it('pluralises Bucket', () => {
      expect(PluralName('Bucket')).toBe('buckets');
    });

    it('pluralises ImagePolicy', () => {
      expect(PluralName('ImagePolicy')).toBe('imagepolicies');
    });

    it('pluralises ImageRepository', () => {
      expect(PluralName('ImageRepository')).toBe('imagerepositories');
    });
  });

  // ── Ends in s / x / z → +es ─────────────────────────────────────────────
  describe('words ending in s, x or z (→ +es)', () => {
    it('appends es to a word ending in s', () => {
      expect(PluralName('Class')).toBe('classes');
    });

    it('appends es to a word ending in x', () => {
      expect(PluralName('Box')).toBe('boxes');
    });

    it('appends es to a word ending in z', () => {
      expect(PluralName('Fuzz')).toBe('fuzzes');
    });
  });

  // ── Ends in y ────────────────────────────────────────────────────────────
  describe('words ending in y', () => {
    it('replaces consonant+y with ies', () => {
      expect(PluralName('Policy')).toBe('policies');
    });

    it('replaces consonant+y with ies (category)', () => {
      expect(PluralName('Category')).toBe('categories');
    });

    it('keeps vowel+y and appends s', () => {
      expect(PluralName('Day')).toBe('days');
    });

    it('keeps vowel+y and appends s (key)', () => {
      expect(PluralName('Key')).toBe('keys');
    });
  });

  // ── Ends in h ────────────────────────────────────────────────────────────
  describe('words ending in h', () => {
    it('appends es after ch', () => {
      expect(PluralName('Watch')).toBe('watches');
    });

    it('appends es after sh', () => {
      expect(PluralName('Mesh')).toBe('meshes');
    });

    it('appends s after other consonant+h', () => {
      expect(PluralName('Auth')).toBe('auths');
    });

    it('appends s after vowel+h (graph)', () => {
      expect(PluralName('Graph')).toBe('graphs');
    });
  });

  // ── Ends in e ────────────────────────────────────────────────────────────
  describe('words ending in e', () => {
    it('converts fe ending to ves (knife)', () => {
      expect(PluralName('Knife')).toBe('knives');
    });

    it('appends s for non-fe ending (HelmRelease)', () => {
      expect(PluralName('HelmRelease')).toBe('helmreleases');
    });

    it('appends s for non-fe ending (Node)', () => {
      expect(PluralName('Node')).toBe('nodes');
    });
  });

  // ── Ends in f → ves ──────────────────────────────────────────────────────
  describe('words ending in f (→ ves)', () => {
    it('converts leaf to leaves', () => {
      expect(PluralName('Leaf')).toBe('leaves');
    });

    it('converts Wolf to wolves', () => {
      expect(PluralName('Wolf')).toBe('wolves');
    });
  });

  // ── Default (→ +s) ───────────────────────────────────────────────────────
  describe('default case (→ +s)', () => {
    it('appends s to a plain noun (Pod)', () => {
      expect(PluralName('Pod')).toBe('pods');
    });

    it('appends s to a CamelCase kind (ConfigMap)', () => {
      expect(PluralName('ConfigMap')).toBe('configmaps');
    });

    it('appends s to a kind ending in t (Bucket)', () => {
      expect(PluralName('Bucket')).toBe('buckets');
    });
  });

  // ── Case handling ─────────────────────────────────────────────────────────
  describe('input casing', () => {
    it('is case-insensitive (all uppercase)', () => {
      expect(PluralName('GITREPOSITORY')).toBe('gitrepositories');
    });

    it('is case-insensitive (all lowercase)', () => {
      expect(PluralName('gitrepository')).toBe('gitrepositories');
    });
  });
});
