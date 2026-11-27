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

import { describe, expect, it } from 'vitest';
import { rawRelease } from '../test/fixtures';
import {
  attentionSeverity,
  chartIconUrl,
  chartLabel,
  countByStatus,
  normalizeTimestamp,
  parseRevision,
  statusSeverity,
  toSummary,
} from './release';

describe('parseRevision', () => {
  it('projects the release record on what the views show', () => {
    const revision = parseRevision(rawRelease({ revision: 4, status: 'failed' }), {
      namespace: 'team-a',
    });

    expect(revision).toMatchObject({
      namespace: 'team-a',
      name: 'web',
      revision: 4,
      status: 'failed',
      updated: '2026-11-17T10:38:29.273Z',
      firstDeployed: '2026-04-02T16:49:13.512Z',
      chartName: 'web',
      chartVersion: '1.2.3',
      appVersion: '4.5.6',
      description: 'Upgrade complete',
      userValues: { replicaCount: 2 },
      defaultValues: { replicaCount: 1, image: { tag: 'stable' } },
      notes: 'Thank you for installing web.',
    });
  });

  it('takes the namespace from the Secret, not from the payload', () => {
    const revision = parseRevision(rawRelease({ namespace: 'elsewhere' }), {
      namespace: 'team-a',
    });

    expect(revision?.namespace).toBe('team-a');
  });

  it('falls back on the Secret labels when the payload does not identify the release', () => {
    const revision = parseRevision(
      { info: {}, chart: {} },
      { namespace: 'team-a', name: 'web', revision: 7, status: 'superseded' }
    );

    expect(revision).toMatchObject({ name: 'web', revision: 7, status: 'superseded' });
    expect(revision?.userValues).toEqual({});
    expect(revision?.defaultValues).toEqual({});
    expect(revision?.manifest).toBe('');
  });

  it.each([[null], ['text'], [[]], [{ info: {} }]])('ignores the record %j', raw => {
    expect(parseRevision(raw, { namespace: 'team-a' })).toBeUndefined();
  });

  it('reports an unexpected status as unknown', () => {
    const raw = { ...rawRelease(), info: { status: '<b>deployed</b>' } };

    expect(parseRevision(raw, { namespace: 'team-a' })?.status).toBe('unknown');
  });
});

describe('toSummary', () => {
  it('drops the heavy content of the revision', () => {
    const summary = toSummary(parseRevision(rawRelease(), { namespace: 'team-a' })!);

    expect(Object.keys(summary).sort()).toEqual([
      'appVersion',
      'chartIcon',
      'chartName',
      'chartVersion',
      'description',
      'firstDeployed',
      'name',
      'namespace',
      'revision',
      'status',
      'updated',
    ]);
  });
});

describe('chartIconUrl', () => {
  it('keeps the HTTPS icon declared by the chart', () => {
    const icon = 'https://charts.example.org/web/logo.svg';

    expect(chartIconUrl(` ${icon} `)).toBe(icon);
    expect(parseRevision(rawRelease({ icon }), { namespace: 'team-a' })?.chartIcon).toBe(icon);
    expect(parseRevision(rawRelease(), { namespace: 'team-a' })?.chartIcon).toBeUndefined();
  });

  it.each([
    [undefined],
    [''],
    [42],
    ['logo.png'],
    ['//charts.example.org/logo.png'],
    ['http://charts.example.org/logo.png'],
    ['javascript:alert(1)'],
    ['data:image/svg+xml;base64,PHN2Zy8+'],
    ['file:///etc/passwd'],
    ['https://user:[REDACTED]@charts.example.org/logo.png'],
    [`https://charts.example.org/${'a'.repeat(2048)}.png`],
  ])('drops %j', value => {
    expect(chartIconUrl(value)).toBeUndefined();
  });
});

describe('normalizeTimestamp', () => {
  it.each([
    ['2026-11-17T10:38:29.273308353Z', '2026-11-17T10:38:29.273Z'],
    ['2026-04-02T18:49:13.512487578+02:00', '2026-04-02T16:49:13.512Z'],
    ['2026-04-02T18:49:13Z', '2026-04-02T18:49:13.000Z'],
  ])('normalizes %s', (value, expected) => {
    expect(normalizeTimestamp(value)).toBe(expected);
  });

  it.each([[undefined], [''], ['yesterday'], ['0001-01-01T00:00:00Z'], [1700000000]])(
    'treats %j as unset',
    value => {
      expect(normalizeTimestamp(value)).toBeUndefined();
    }
  );
});

describe('chartLabel', () => {
  it('joins the chart name and version like helm ls', () => {
    expect(chartLabel({ chartName: 'cert-manager', chartVersion: 'v1.21.3' })).toBe(
      'cert-manager-v1.21.3'
    );
    expect(chartLabel({ chartName: 'web', chartVersion: '' })).toBe('web');
  });
});

describe('statusSeverity', () => {
  it.each([
    ['deployed', 'success'],
    ['failed', 'error'],
    ['pending-upgrade', 'warning'],
    ['uninstalling', 'warning'],
    ['superseded', ''],
    ['unknown', ''],
  ])('maps %s to %j', (status, severity) => {
    expect(statusSeverity(status)).toBe(severity);
  });
});

describe('attentionSeverity', () => {
  it.each([
    ['deployed', ''],
    ['failed', 'error'],
    ['pending-upgrade', 'warning'],
    ['uninstalled', 'warning'],
    ['unknown', 'warning'],
  ])('maps %s to %j', (status, severity) => {
    expect(attentionSeverity(status)).toBe(severity);
  });
});

describe('countByStatus', () => {
  it('counts each status, what needs attention first and deployed last', () => {
    const statuses = ['deployed', 'pending-upgrade', 'failed', 'deployed', 'failed', 'deployed'];

    expect(countByStatus(statuses.map(status => ({ status })))).toEqual([
      { status: 'failed', count: 2 },
      { status: 'pending-upgrade', count: 1 },
      { status: 'deployed', count: 3 },
    ]);
    expect(countByStatus([])).toEqual([]);
  });
});
