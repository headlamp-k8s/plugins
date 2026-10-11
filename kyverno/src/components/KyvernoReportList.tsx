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

import { Icon } from '@iconify/react';
import { Activity, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link as MuiLink } from '@mui/material';
import {
  AdmissionReport,
  BackgroundScanReport,
  ClusterAdmissionReport,
  ClusterBackgroundScanReport,
  ClusterEphemeralReport,
  EphemeralReport,
} from '../resources/kyvernoReports';
import { SummaryChips } from './common';
import { ReportClass, ReportLike, ReportViewer } from './ReportViewer';

// ── Pure component for Storybook (no API calls, accepts props directly) ───
export interface KyvernoReportRow {
  name: string;
  namespace?: string;
  owner?: string;
  pass: number;
  fail: number;
  warn: number;
  error: number;
  skip: number;
  creationTimestamp?: string;
}

export function PureKyvernoReportTable({
  title,
  isNamespaced,
  items,
  onNameClick,
}: {
  title: string;
  isNamespaced: boolean;
  items: KyvernoReportRow[];
  onNameClick?: (item: KyvernoReportRow) => void;
}) {
  return (
    <Box>
      <SectionHeader title={title} />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (row: KyvernoReportRow) =>
              onNameClick ? (
                <MuiLink
                  component="button"
                  onClick={() => onNameClick(row)}
                  sx={{ textAlign: 'left' }}
                >
                  {row.name}
                </MuiLink>
              ) : (
                row.name
              ),
          },
          ...(isNamespaced
            ? [{ label: 'Namespace', getter: (row: KyvernoReportRow) => row.namespace ?? '—' }]
            : []),
          { label: 'Owner', getter: (row: KyvernoReportRow) => row.owner ?? '—' },
          { label: 'Pass', getter: (row: KyvernoReportRow) => row.pass },
          { label: 'Fail', getter: (row: KyvernoReportRow) => row.fail },
          { label: 'Warn', getter: (row: KyvernoReportRow) => row.warn },
          { label: 'Error', getter: (row: KyvernoReportRow) => row.error },
          { label: 'Skip', getter: (row: KyvernoReportRow) => row.skip },
          {
            label: 'Summary',
            getter: (row: KyvernoReportRow) => (
              <SummaryChips
                summary={{
                  pass: row.pass,
                  fail: row.fail,
                  warn: row.warn,
                  error: row.error,
                  skip: row.skip,
                }}
              />
            ),
          },
          {
            label: 'Age',
            getter: (row: KyvernoReportRow) =>
              row.creationTimestamp ? (
                <DateLabel date={row.creationTimestamp} format="mini" />
              ) : (
                '—'
              ),
          },
        ]}
        data={items}
        emptyMessage={`No ${title.toLowerCase()} found`}
      />
    </Box>
  );
}

export type AnyKyvernoReportClass =
  | typeof AdmissionReport
  | typeof ClusterAdmissionReport
  | typeof BackgroundScanReport
  | typeof ClusterBackgroundScanReport
  | typeof EphemeralReport
  | typeof ClusterEphemeralReport;

interface KyvernoReportListProps<T extends AnyKyvernoReportClass> {
  /** Untranslated title key, fed through useTranslation. */
  titleKey: string;
  resourceClass: T;
  /** Short id prefix used for the Activity panel — keeps panels distinct per kind. */
  activityIdPrefix: string;
}

export function KyvernoReportList<T extends AnyKyvernoReportClass>({
  titleKey,
  resourceClass,
  activityIdPrefix,
}: KyvernoReportListProps<T>) {
  const { t } = useTranslation();
  const isNamespaced = resourceClass.isNamespaced;

  function openReport(item: InstanceType<T>) {
    const name = item.jsonData.metadata.name;
    const namespace = item.jsonData.metadata.namespace;
    Activity.launch({
      id: `${activityIdPrefix}:${namespace ?? ''}:${name}`,
      location: 'split-right',
      icon: <Icon icon="mdi:shield-check" />,
      title: namespace ? `${namespace}/${name}` : name,
      content: (
        <ReportViewer
          name={name}
          namespace={namespace}
          isClusterScoped={!isNamespaced}
          resourceClass={resourceClass as unknown as ReportClass<ReportLike>}
        />
      ),
    });
  }

  return (
    <ResourceListView
      title={t(titleKey)}
      resourceClass={resourceClass}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openReport(item as InstanceType<T>)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        ...(isNamespaced ? (['namespace'] as const) : []),
        {
          id: 'owner',
          label: t('Owner'),
          getValue: item => {
            const o = item.scope;
            if (!o || !o.kind) return '';
            return `${o.kind}/${o.name ?? ''}`;
          },
        },
        {
          id: 'pass',
          label: t('Pass'),
          getValue: item => item.summary.pass || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'fail',
          label: t('Fail'),
          getValue: item => item.summary.fail || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'warn',
          label: t('Warn'),
          getValue: item => item.summary.warn || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'error',
          label: t('Error'),
          getValue: item => item.summary.error || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'skip',
          label: t('Skip'),
          getValue: item => item.summary.skip || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'summary',
          label: t('Summary'),
          render: item => <SummaryChips summary={item.summary} />,
          getValue: item => item.totalResults,
        },
        'age',
      ]}
    />
  );
}

export const AdmissionReportList = () => (
  <KyvernoReportList
    titleKey="Admission Reports"
    resourceClass={AdmissionReport}
    activityIdPrefix="kyverno-admrpt"
  />
);

export const ClusterAdmissionReportList = () => (
  <KyvernoReportList
    titleKey="Cluster Admission Reports"
    resourceClass={ClusterAdmissionReport}
    activityIdPrefix="kyverno-cadmrpt"
  />
);

export const BackgroundScanReportList = () => (
  <KyvernoReportList
    titleKey="Background Scan Reports"
    resourceClass={BackgroundScanReport}
    activityIdPrefix="kyverno-bgscan"
  />
);

export const ClusterBackgroundScanReportList = () => (
  <KyvernoReportList
    titleKey="Cluster Background Scan Reports"
    resourceClass={ClusterBackgroundScanReport}
    activityIdPrefix="kyverno-cbgscan"
  />
);

export const EphemeralReportList = () => (
  <KyvernoReportList
    titleKey="Ephemeral Reports"
    resourceClass={EphemeralReport}
    activityIdPrefix="kyverno-ephrpt"
  />
);

export const ClusterEphemeralReportList = () => (
  <KyvernoReportList
    titleKey="Cluster Ephemeral Reports"
    resourceClass={ClusterEphemeralReport}
    activityIdPrefix="kyverno-cephrpt"
  />
);
