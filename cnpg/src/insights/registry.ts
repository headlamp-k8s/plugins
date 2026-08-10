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

import { Finding, InsightsContext, InsightsProvider, SEVERITY_ORDER } from './types';

/**
 * The provider registry behind the insights panel.
 *
 * Providers are keyed by name so that a module evaluated twice — which bundlers
 * and hot reload both make possible — cannot double every finding.
 */
const providers = new Map<string, InsightsProvider>();

export function registerInsightsProvider(provider: InsightsProvider): void {
  providers.set(provider.name, provider);
}

export function getInsightsProviders(): InsightsProvider[] {
  return [...providers.values()];
}

/** Test seam: no production caller should need this. */
export function clearInsightsProviders(): void {
  providers.clear();
}

/**
 * Turns a provider failure into a finding.
 *
 * A provider that throws is itself a fact worth showing: silently dropping it
 * would leave the panel looking complete while a whole class of checks did not
 * run. It is reported as `unknown` rather than as an error, because a failed
 * check says nothing about the health of the cluster.
 */
function providerFailure(provider: InsightsProvider, error: unknown): Finding {
  const message = error instanceof Error ? error.message : String(error);

  return {
    id: `provider-failed-${provider.name}`,
    severity: 'unknown',
    message: `Some checks could not run: the "${provider.name}" insights provider failed.`,
    evidence: [message],
    source: provider.name,
  };
}

/**
 * Runs every registered provider and returns their findings, worst first.
 *
 * Providers are isolated from each other: one that throws or rejects yields a
 * single unknown-severity finding and never suppresses another provider's
 * output.
 */
export async function collectFindings(context: InsightsContext): Promise<Finding[]> {
  const collected = await Promise.all(
    getInsightsProviders().map(async provider => {
      try {
        const findings = await provider.getFindings(context);

        // The provider's own `source` is overwritten: attribution is the
        // registry's job, so a provider cannot claim to be another one.
        return findings.map(finding => ({ ...finding, source: provider.name }));
      } catch (error) {
        return [providerFailure(provider, error)];
      }
    })
  );

  // Stable within a severity band, so findings keep their providers'
  // registration and declaration order rather than shuffling between renders.
  return collected.flat().sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
