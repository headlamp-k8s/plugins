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

import type {
  PolicyReportInterface,
  PolicyReportResult,
  PolicyReportSummary,
} from '../resources/policyReport';

export interface PolicyReportSource {
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      uid?: string;
    }[];
  };
  scope?: PolicyReportInterface['scope'];
  summary: PolicyReportSummary;
  results: PolicyReportResult[];
}

export interface ReportSourceList {
  items: PolicyReportSource[] | null;
  error?: unknown;
}

export interface CombinedReportSources {
  reports: PolicyReportSource[];
  loading: boolean;
  error?: unknown;
}

const POLICY_SOURCES_WITHOUT_RULE_IDENTITY = new Set([
  'ValidatingAdmissionPolicy',
  'KyvernoValidatingPolicy',
  'KyvernoImageValidatingPolicy',
  'KyvernoGeneratingPolicy',
  'KyvernoMutatingPolicy',
  'MutatingAdmissionPolicy',
]);

const RESOURCE_UID_LABEL = 'audit.kyverno.io/resource.uid';
const RESOURCE_GROUP_LABEL = 'audit.kyverno.io/resource.group';
const RESOURCE_VERSION_LABEL = 'audit.kyverno.io/resource.version';
const RESOURCE_KIND_LABEL = 'audit.kyverno.io/resource.kind';
const RESOURCE_NAMESPACE_ANNOTATION = 'audit.kyverno.io/resource.namespace';
const RESOURCE_NAME_ANNOTATION = 'audit.kyverno.io/resource.name';

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    response?: { status?: unknown };
  };
  const status =
    candidate.status ?? candidate.statusCode ?? candidate.code ?? candidate.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

function resultTimestamp(result: PolicyReportResult): [number, number] {
  return [result.timestamp?.seconds || 0, result.timestamp?.nanos || 0];
}

function isNewerResult(candidate: PolicyReportResult, current: PolicyReportResult): boolean {
  const [candidateSeconds, candidateNanos] = resultTimestamp(candidate);
  const [currentSeconds, currentNanos] = resultTimestamp(current);
  return (
    candidateSeconds > currentSeconds ||
    (candidateSeconds === currentSeconds && candidateNanos > currentNanos)
  );
}

function qualifiedResourceIdentity(resource: {
  apiVersion?: string;
  kind?: string;
  namespace?: string;
  name?: string;
}): string | undefined {
  if (!resource.apiVersion && !resource.kind && !resource.namespace && !resource.name) {
    return undefined;
  }

  return [resource.apiVersion, resource.kind, resource.namespace, resource.name].join('/');
}

function reportMetadataResourceUid(report: PolicyReportSource): string | undefined {
  const { labels = {}, ownerReferences = [] } = report.metadata;
  const resourceUid = labels[RESOURCE_UID_LABEL];
  if (resourceUid) return resourceUid;

  const ownerWithUid = ownerReferences.find(owner => owner.uid);
  return ownerWithUid?.uid;
}

function reportMetadataResourceIdentity(report: PolicyReportSource): string | undefined {
  const { annotations = {}, labels = {}, ownerReferences = [] } = report.metadata;

  const owner = ownerReferences.find(owner => owner.name);
  if (owner) {
    return qualifiedResourceIdentity({
      apiVersion: owner.apiVersion,
      kind: owner.kind,
      namespace: annotations[RESOURCE_NAMESPACE_ANNOTATION] || report.metadata.namespace,
      name: owner.name,
    });
  }

  const name = annotations[RESOURCE_NAME_ANNOTATION];
  if (!name) return undefined;

  const group = labels[RESOURCE_GROUP_LABEL];
  const version = labels[RESOURCE_VERSION_LABEL];
  return qualifiedResourceIdentity({
    apiVersion: group ? `${group}/${version || ''}` : version,
    kind: labels[RESOURCE_KIND_LABEL],
    namespace: annotations[RESOURCE_NAMESPACE_ANNOTATION] || report.metadata.namespace,
    name,
  });
}

function resourceIdentity(report: PolicyReportSource, result: PolicyReportResult): string {
  const metadataUid = reportMetadataResourceUid(report);
  if (metadataUid) return metadataUid;

  if (report.scope?.uid) return report.scope.uid;

  const resourceWithUid = result.resources?.find(resource => resource.uid);
  if (resourceWithUid?.uid) return resourceWithUid.uid;

  const metadataIdentity = reportMetadataResourceIdentity(report);
  if (metadataIdentity) return metadataIdentity;

  if (report.scope) {
    const scopeIdentity = qualifiedResourceIdentity(report.scope);
    if (scopeIdentity) return scopeIdentity;
  }

  if (result.resources?.length) {
    return result.resources
      .map(resource =>
        [resource.apiVersion, resource.kind, resource.namespace, resource.name].join('/')
      )
      .sort()
      .join(',');
  }

  // Without resource identity, keep different reports separate rather than
  // accidentally collapsing unrelated policy evaluations.
  return `${report.metadata.namespace || ''}/${report.metadata.name}`;
}

function resultIdentity(report: PolicyReportSource, result: PolicyReportResult): string {
  const includeRule = !POLICY_SOURCES_WITHOUT_RULE_IDENTITY.has(result.source || '');
  return [
    result.source || '',
    result.policy,
    includeRule ? result.rule || '' : '',
    resourceIdentity(report, result),
  ].join('|');
}

function summarizeResults(results: PolicyReportResult[]): PolicyReportSummary {
  const summary: PolicyReportSummary = {};
  for (const result of results) {
    summary[result.result] = (summary[result.result] || 0) + 1;
  }
  return summary;
}

function mergeReportResults(reports: PolicyReportSource[]): PolicyReportSource[] {
  const winners = new Map<
    string,
    { reportIndex: number; result: PolicyReportResult; resultIndex: number }
  >();
  let resultIndex = 0;

  reports.forEach((report, reportIndex) => {
    report.results.forEach(result => {
      const identity = resultIdentity(report, result);
      const current = winners.get(identity);
      if (!current || isNewerResult(result, current.result)) {
        winners.set(identity, { reportIndex, result, resultIndex });
      }
      resultIndex += 1;
    });
  });

  const resultsByReport = new Map<number, { result: PolicyReportResult; resultIndex: number }[]>();
  for (const winner of winners.values()) {
    const reportResults = resultsByReport.get(winner.reportIndex) || [];
    reportResults.push({ result: winner.result, resultIndex: winner.resultIndex });
    resultsByReport.set(winner.reportIndex, reportResults);
  }

  return reports.flatMap((report, reportIndex) => {
    const selected = resultsByReport.get(reportIndex);
    if (!selected?.length) return [];

    const results = selected
      .sort((a, b) => a.resultIndex - b.resultIndex)
      .map(({ result }) => result);
    return [{ ...report, results, summary: summarizeResults(results) }];
  });
}

export function policyIdentity(name: string, namespace?: string): string {
  return namespace ? `${namespace}/${name}` : name;
}

export function reportSourceErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
}

export function combineReportSources(sourceLists: ReportSourceList[]): CombinedReportSources {
  const error = sourceLists
    .map(source => source.error)
    .find(value => value && !isNotFoundError(value));
  const loading = !error && sourceLists.some(source => source.items === null && !source.error);
  const reports = mergeReportResults(sourceLists.flatMap(source => source.items || []));

  return { reports, loading, ...(error ? { error } : {}) };
}
