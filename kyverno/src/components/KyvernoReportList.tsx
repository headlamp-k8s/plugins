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
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as MuiLink } from '@mui/material';
import {
  AdmissionReport,
  BackgroundScanReport,
  ClusterAdmissionReport,
  ClusterBackgroundScanReport,
  ClusterEphemeralReport,
  EphemeralReport,
} from '../resources/kyvernoReports';
import { SummaryChips } from './common';
import { ReportViewer } from './ReportViewer';

type AnyKyvernoReportClass =
  | typeof AdmissionReport
  | typeof ClusterAdmissionReport
  | typeof BackgroundScanReport
  | typeof ClusterBackgroundScanReport
  | typeof EphemeralReport
  | typeof ClusterEphemeralReport;

interface KyvernoReportListProps<T extends AnyKyvernoReportClass> {
  title: string;
  resourceClass: T;
  /** Short id prefix used for the Activity panel — keeps panels distinct per kind. */
  activityIdPrefix: string;
}

export function KyvernoReportList<T extends AnyKyvernoReportClass>({
  title,
  resourceClass,
  activityIdPrefix,
}: KyvernoReportListProps<T>) {
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
          resourceClass={resourceClass}
        />
      ),
    });
  }

  return (
    <ResourceListView
      title={title}
      resourceClass={resourceClass}
      columns={[
        {
          id: 'name',
          label: 'Name',
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
          label: 'Owner',
          getValue: item => {
            const o = item.scope;
            if (!o || !o.kind) return '';
            return `${o.kind}/${o.name ?? ''}`;
          },
        },
        {
          id: 'pass',
          label: 'Pass',
          getValue: item => item.summary.pass || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'fail',
          label: 'Fail',
          getValue: item => item.summary.fail || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'warn',
          label: 'Warn',
          getValue: item => item.summary.warn || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'error',
          label: 'Error',
          getValue: item => item.summary.error || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'skip',
          label: 'Skip',
          getValue: item => item.summary.skip || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'summary',
          label: 'Summary',
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
    title="Admission Reports"
    resourceClass={AdmissionReport}
    activityIdPrefix="kyverno-admrpt"
  />
);

export const ClusterAdmissionReportList = () => (
  <KyvernoReportList
    title="Cluster Admission Reports"
    resourceClass={ClusterAdmissionReport}
    activityIdPrefix="kyverno-cadmrpt"
  />
);

export const BackgroundScanReportList = () => (
  <KyvernoReportList
    title="Background Scan Reports"
    resourceClass={BackgroundScanReport}
    activityIdPrefix="kyverno-bgscan"
  />
);

export const ClusterBackgroundScanReportList = () => (
  <KyvernoReportList
    title="Cluster Background Scan Reports"
    resourceClass={ClusterBackgroundScanReport}
    activityIdPrefix="kyverno-cbgscan"
  />
);

export const EphemeralReportList = () => (
  <KyvernoReportList
    title="Ephemeral Reports"
    resourceClass={EphemeralReport}
    activityIdPrefix="kyverno-ephrpt"
  />
);

export const ClusterEphemeralReportList = () => (
  <KyvernoReportList
    title="Cluster Ephemeral Reports"
    resourceClass={ClusterEphemeralReport}
    activityIdPrefix="kyverno-cephrpt"
  />
);
