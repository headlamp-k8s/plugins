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
  cluster?: string;
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
  loading: boolean;
  errors?: readonly unknown[];
}

export interface CombinedReportSources {
  reports: PolicyReportSource[];
  loading: boolean;
  error?: unknown;
  restrictedEphemeralReports?: boolean;
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

type ReportResourceReference = NonNullable<PolicyReportInterface['scope']>;

function hasResourceReference(resource?: ReportResourceReference): boolean {
  return Boolean(resource?.apiVersion || resource?.kind || resource?.name || resource?.uid);
}

function metadataResourceReference(
  report: PolicyReportSource
): ReportResourceReference | undefined {
  const { annotations = {}, labels = {}, ownerReferences = [] } = report.metadata;
  const owner = ownerReferences.find(reference => reference.name);
  const group = labels[RESOURCE_GROUP_LABEL];
  const version = labels[RESOURCE_VERSION_LABEL];
  const apiVersion =
    owner?.apiVersion || (group && version ? `${group}/${version}` : version || group);
  const resource: ReportResourceReference = {
    apiVersion,
    kind: owner?.kind || labels[RESOURCE_KIND_LABEL],
    namespace: annotations[RESOURCE_NAMESPACE_ANNOTATION] || report.metadata.namespace,
    name: owner?.name || annotations[RESOURCE_NAME_ANNOTATION],
    uid: labels[RESOURCE_UID_LABEL] || owner?.uid || ownerReferences.find(ref => ref.uid)?.uid,
  };

  return hasResourceReference(resource) ? resource : undefined;
}

function reportResourceReference(report: PolicyReportSource): ReportResourceReference | undefined {
  const metadataResource = metadataResourceReference(report);
  const reportScope = report.scope;
  const resource = {
    apiVersion: reportScope?.apiVersion || metadataResource?.apiVersion,
    kind: reportScope?.kind || metadataResource?.kind,
    namespace: reportScope?.namespace || metadataResource?.namespace,
    name: reportScope?.name || metadataResource?.name,
    uid: reportScope?.uid || metadataResource?.uid,
  };
  return hasResourceReference(resource) ? resource : undefined;
}

/**
 * Kyverno admission reports can omit both spec.owner and result.resources,
 * leaving the evaluated resource only in audit.kyverno.io metadata.
 */
export function normalizeReportResource(report: PolicyReportSource): PolicyReportSource {
  const scope = reportResourceReference(report);
  const results = report.results.map(result =>
    !result.resources?.length && scope ? { ...result, resources: [scope] } : result
  );

  return { ...report, scope, results };
}

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

function resourceReferenceIdentity(resource: ReportResourceReference): string {
  return JSON.stringify(
    resource.uid
      ? ['uid', resource.uid]
      : [
          'reference',
          resource.apiVersion || '',
          resource.kind || '',
          resource.namespace || '',
          resource.name || '',
        ]
  );
}

function resourceIdentity(report: PolicyReportSource, result: PolicyReportResult): string[] {
  if (result.resources?.length) {
    return result.resources.map(resourceReferenceIdentity).sort();
  }

  const resource = reportResourceReference(report);
  if (resource) return [resourceReferenceIdentity(resource)];

  // Keep evaluations without resource identity distinct across reports.
  return [JSON.stringify(['report', report.metadata.namespace, report.metadata.name])];
}

function resultIdentity(report: PolicyReportSource, result: PolicyReportResult): string {
  const includeRule = !POLICY_SOURCES_WITHOUT_RULE_IDENTITY.has(result.source || '');
  return JSON.stringify([
    report.cluster || '',
    result.source || '',
    result.policy,
    includeRule ? result.rule || '' : '',
    resourceIdentity(report, result),
  ]);
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

function reportSourceFailures(source: ReportSourceList): unknown[] {
  return (source.errors ?? []).filter(error => error && !isNotFoundError(error));
}

export function combineReportSources(sourceLists: ReportSourceList[]): CombinedReportSources {
  const errors = sourceLists.flatMap(reportSourceFailures);
  const error =
    errors.length > 1
      ? { errors, message: errors.map(reportSourceErrorMessage).join(', ') }
      : errors[0];
  const loading = !error && sourceLists.some(source => source.loading);
  const reports = mergeReportResults(sourceLists.flatMap(source => source.items ?? []));

  return { reports, loading, ...(error ? { error } : {}) };
}

export function combineNamespacedReportSources(
  durableReports: ReportSourceList,
  ephemeralReports: ReportSourceList
): CombinedReportSources {
  const ephemeralErrors = reportSourceFailures(ephemeralReports);
  const durableAvailable =
    !durableReports.errors?.length && (durableReports.items !== null || durableReports.loading);

  if (
    durableAvailable &&
    ephemeralErrors.length > 0 &&
    ephemeralErrors.every(error => getErrorStatus(error) === 403)
  ) {
    return {
      ...combineReportSources([durableReports, { ...ephemeralReports, errors: [] }]),
      restrictedEphemeralReports: true,
    };
  }

  return combineReportSources([durableReports, ephemeralReports]);
}
