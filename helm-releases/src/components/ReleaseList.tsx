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

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  SectionBox,
  SectionFilterHeader,
  StatusLabel,
  Table,
  TableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { attentionSeverity, chartLabel, countByStatus, HelmReleaseSummary } from '../helm/release';
import {
  describeAccessError,
  HelmAccessError,
  listReleases,
  ReleaseListResult,
} from '../helm/releaseStore';
import { headlampTransport } from '../host/headlampTransport';
import { HELM_ROUTES } from '../host/routes';
import { useNamespaceScope } from '../host/useNamespaceScope';
import { ChartIcon } from './ChartIcon';
import { ReleaseDate, ReleaseStatus } from './ReleaseLabels';
import { useLoad } from './useLoad';

function useColumns(): TableColumn<HelmReleaseSummary>[] {
  return useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: release => release.name,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChartIcon url={row.original.chartIcon} />
            <Link
              routeName={HELM_ROUTES.detail.name}
              params={{ namespace: row.original.namespace, name: row.original.name }}
            >
              {row.original.name}
            </Link>
          </Box>
        ),
        gridTemplate: 1.5,
      },
      {
        id: 'namespace',
        header: 'Namespace',
        accessorFn: release => release.namespace,
      },
      {
        id: 'revision',
        header: 'Revision',
        accessorFn: release => release.revision,
        gridTemplate: 'min-content',
      },
      {
        id: 'updated',
        header: 'Updated',
        accessorFn: release => release.updated ?? '',
        Cell: ({ row }) => <ReleaseDate date={row.original.updated} />,
        gridTemplate: 'min-content',
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: release => release.status,
        Cell: ({ row }) => <ReleaseStatus status={row.original.status} />,
        gridTemplate: 'min-content',
      },
      {
        id: 'chart',
        header: 'Chart',
        accessorFn: release => chartLabel(release),
        gridTemplate: 1.5,
      },
      {
        id: 'appVersion',
        header: 'App Version',
        accessorFn: release => release.appVersion,
      },
    ],
    []
  );
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** What could not be read, so that a short list is never mistaken for a complete one. */
function ListNotices({ result }: { result: ReleaseListResult }) {
  return (
    <>
      {result.clusterWideDenied && (
        <Alert severity="info" sx={{ mb: 1 }}>
          You do not have cluster-wide access to Helm releases. Select your namespaces in the
          Namespaces filter above to list their releases.
        </Alert>
      )}
      {result.deniedNamespaces.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {`You do not have access to the Helm releases of: ${result.deniedNamespaces.join(', ')}.`}
        </Alert>
      )}
      {result.failedNamespaces.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {`The Helm releases could not be loaded from: ${result.failedNamespaces.join(', ')}.`}
        </Alert>
      )}
      {result.unreadable > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {`${plural(result.unreadable, 'release record')} could not be read and ${
            result.unreadable === 1 ? 'is' : 'are'
          } not listed.`}
        </Alert>
      )}
    </>
  );
}

/**
 * Number of releases in each status, over the whole list rather than the page displayed, so that
 * a release that is not deployed is noticed even when it sits on another page of the table.
 */
function StatusSummary({ releases }: { releases: HelmReleaseSummary[] }) {
  const counts = useMemo(() => countByStatus(releases), [releases]);
  if (releases.length === 0) return null;

  return (
    <Box
      component="ul"
      aria-label="Releases by status"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        listStyle: 'none',
        p: 0,
        m: 0,
        mb: 1.5,
      }}
    >
      <Typography component="li" variant="body2" color="text.secondary">
        {`${plural(releases.length, 'release')}:`}
      </Typography>
      {counts.map(({ status, count }) => (
        <li key={status}>
          <StatusLabel status={attentionSeverity(status)}>{`${count} ${status}`}</StatusLabel>
        </li>
      ))}
    </Box>
  );
}

/**
 * Installed Helm releases, as `helm ls -A` lists them, limited to what the user may read.
 *
 * The namespaces come from Headlamp's namespace filter. Without any, the whole cluster is read,
 * which users restricted to some namespaces are not allowed to do: they are asked to pick theirs.
 */
export function ReleaseList() {
  const cluster = K8s.useCluster();
  const namespaces = useNamespaceScope(cluster);
  const columns = useColumns();

  const load = useCallback(
    () =>
      cluster
        ? listReleases(headlampTransport, cluster, namespaces)
        : Promise.reject(new HelmAccessError('unavailable')),
    [cluster, namespaces]
  );
  const { state, reload } = useLoad(load);
  const result = state.status === 'ready' ? state.data : undefined;

  return (
    <SectionBox
      title={
        <SectionFilterHeader
          title="Helm Releases"
          actions={[
            <Tooltip key="refresh" title="Refresh">
              <span>
                <IconButton
                  aria-label="Refresh"
                  onClick={reload}
                  disabled={state.status === 'loading'}
                >
                  <Icon icon="mdi:refresh" width={22} height={22} />
                </IconButton>
              </span>
            </Tooltip>,
          ]}
        />
      }
    >
      {state.status === 'error' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {`The Helm releases could not be loaded. ${describeAccessError(state.kind)}`}
        </Alert>
      )}
      {result && <ListNotices result={result} />}
      {result && <StatusSummary releases={result.releases} />}
      {state.status !== 'error' && !result?.clusterWideDenied && (
        <Table
          columns={columns}
          data={result?.releases ?? []}
          loading={state.status === 'loading'}
          emptyMessage="No Helm release found."
          initialState={{ sorting: [{ id: 'name', desc: false }] }}
        />
      )}
    </SectionBox>
  );
}
