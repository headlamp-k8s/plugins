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

import {
  clearInsightsProviders,
  collectFindings,
  getInsightsProviders,
  registerInsightsProvider,
} from './registry';
import { Finding, InsightsContext, InsightsProvider } from './types';

const context: InsightsContext = {
  cluster: { metadata: { name: 'pg-1' } },
  backups: [],
  scheduledBackups: [],
  backupsReadable: true,
  scheduledBackupsReadable: true,
  now: Date.parse('2026-08-10T12:00:00Z'),
};

/**
 * A provider with no relationship to the rules engine.
 *
 * Its only job is to prove the seam: the registry must collect from it, stamp
 * it, and sort it alongside everything else without knowing anything about it.
 */
function dummyProvider(name: string, findings: Partial<Finding>[]): InsightsProvider {
  return {
    name,
    getFindings: () =>
      findings.map((finding, index) => ({
        id: `${name}-${index}`,
        severity: 'info',
        message: '',
        evidence: [],
        source: 'ignored',
        ...finding,
      })) as Finding[],
  };
}

beforeEach(() => {
  clearInsightsProviders();
});

describe('registerInsightsProvider', () => {
  it('collects findings from every registered provider', async () => {
    registerInsightsProvider(dummyProvider('alpha', [{ message: 'from alpha' }]));
    registerInsightsProvider(dummyProvider('beta', [{ message: 'from beta' }]));

    const findings = await collectFindings(context);

    expect(findings.map(finding => finding.message)).toEqual(['from alpha', 'from beta']);
  });

  it('registers a provider only once, so a re-imported module cannot double findings', () => {
    const provider = dummyProvider('alpha', [{ message: 'once' }]);
    registerInsightsProvider(provider);
    registerInsightsProvider(provider);

    expect(getInsightsProviders()).toHaveLength(1);
  });

  it('replaces a previously registered provider with the same name', async () => {
    registerInsightsProvider(dummyProvider('alpha', [{ message: 'old' }]));
    registerInsightsProvider(dummyProvider('alpha', [{ message: 'new' }]));

    const findings = await collectFindings(context);

    expect(findings.map(finding => finding.message)).toEqual(['new']);
  });
});

describe('collectFindings', () => {
  it('stamps each finding with the name of the provider that produced it', async () => {
    registerInsightsProvider(dummyProvider('alpha', [{ source: 'a lie' }]));

    const [finding] = await collectFindings(context);

    expect(finding.source).toBe('alpha');
  });

  it('awaits providers that return a promise', async () => {
    registerInsightsProvider({
      name: 'async-provider',
      getFindings: async () => [
        { id: 'x', severity: 'warning', message: 'later', evidence: [], source: '' },
      ],
    });

    const findings = await collectFindings(context);

    expect(findings.map(finding => finding.message)).toEqual(['later']);
  });

  it('orders findings by severity so the worst news is first', async () => {
    registerInsightsProvider(
      dummyProvider('alpha', [
        { severity: 'info', message: 'info' },
        { severity: 'critical', message: 'critical' },
        { severity: 'unknown', message: 'unknown' },
        { severity: 'warning', message: 'warning' },
      ])
    );

    const findings = await collectFindings(context);

    expect(findings.map(finding => finding.message)).toEqual([
      'critical',
      'warning',
      'unknown',
      'info',
    ]);
  });

  it('keeps the findings of other providers when one throws', async () => {
    registerInsightsProvider({
      name: 'broken',
      getFindings: () => {
        throw new Error('provider exploded');
      },
    });
    registerInsightsProvider(dummyProvider('alpha', [{ message: 'still here' }]));

    const findings = await collectFindings(context);

    expect(findings.map(finding => finding.message)).toContain('still here');
  });

  it('reports a throwing provider as an unknown-severity finding rather than hiding it', async () => {
    registerInsightsProvider({
      name: 'broken',
      getFindings: () => {
        throw new Error('provider exploded');
      },
    });

    const [finding] = await collectFindings(context);

    expect(finding.severity).toBe('unknown');
    expect(finding.source).toBe('broken');
    expect(finding.evidence.join(' ')).toContain('provider exploded');
  });

  it('reports a provider whose promise rejects the same way', async () => {
    registerInsightsProvider({
      name: 'broken-async',
      getFindings: () => Promise.reject(new Error('network down')),
    });

    const [finding] = await collectFindings(context);

    expect(finding.severity).toBe('unknown');
    expect(finding.evidence.join(' ')).toContain('network down');
  });

  it('returns nothing when no provider is registered', async () => {
    expect(await collectFindings(context)).toEqual([]);
  });
});
