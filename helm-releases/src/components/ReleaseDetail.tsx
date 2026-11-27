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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { chartLabel, HelmRevision } from '../helm/release';
import {
  AccessErrorKind,
  describeAccessError,
  HelmAccessError,
  listRevisions,
} from '../helm/releaseStore';
import { headlampTransport } from '../host/headlampTransport';
import { releaseListURL } from '../host/routes';
import { ChartIcon } from './ChartIcon';
import { ReleaseDate, ReleaseStatus } from './ReleaseLabels';
import { RevisionExplorer } from './RevisionExplorer';
import { useLoad } from './useLoad';

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function describeFailure(kind: AccessErrorKind, namespace: string, name: string): string {
  if (kind === 'forbidden') {
    return `You do not have access to the Helm releases of the namespace ${namespace}.`;
  }
  if (kind === 'not-found') {
    return `No Helm release named ${name} was found in the namespace ${namespace}.`;
  }
  return `The release could not be loaded. ${describeAccessError(kind)}`;
}

const TITLE_ICON_SIZE = 40;

/**
 * Name of the release, preceded by the icon of its chart once that icon is displayed: without it,
 * the title is exactly the plain one.
 */
function ReleaseTitle({ release }: { release: HelmRevision }) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
      <ChartIcon url={release.chartIcon} size={TITLE_ICON_SIZE} collapsible />
      {release.name}
    </Box>
  );
}

function RevisionHistory(props: {
  revisions: HelmRevision[];
  selected: HelmRevision;
  onSelect: (revision: number) => void;
}) {
  const { revisions, selected, onSelect } = props;

  return (
    <TableContainer>
      <Table size="small" aria-label="Revision history">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>Revision</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Chart</TableCell>
            <TableCell>App version</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {revisions.map(revision => {
            const isSelected = revision.revision === selected.revision;
            return (
              <TableRow
                key={revision.revision}
                hover
                selected={isSelected}
                onClick={() => onSelect(revision.revision)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Radio
                    size="small"
                    name="helm-release-revision"
                    checked={isSelected}
                    onChange={() => onSelect(revision.revision)}
                    inputProps={{ 'aria-label': `Explore revision ${revision.revision}` }}
                  />
                </TableCell>
                <TableCell>{revision.revision}</TableCell>
                <TableCell>
                  <ReleaseDate date={revision.updated} />
                </TableCell>
                <TableCell>
                  <ReleaseStatus status={revision.status} />
                </TableCell>
                <TableCell>{chartLabel(revision)}</TableCell>
                <TableCell>{revision.appVersion}</TableCell>
                <TableCell>{revision.description}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Detail of a release: its current state, its revision history and the content of a revision. */
export function ReleaseDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const cluster = K8s.useCluster();
  const [selectedRevision, setSelectedRevision] = useState<number>();

  const load = useCallback(
    () =>
      cluster
        ? listRevisions(headlampTransport, cluster, namespace, name)
        : Promise.reject(new HelmAccessError('unavailable')),
    [cluster, namespace, name]
  );
  const { state, reload } = useLoad(load);
  const backLink = releaseListURL() ?? true;

  if (state.status === 'loading') {
    return (
      <SectionBox title={name} backLink={backLink}>
        <Loader title="Loading the release" />
      </SectionBox>
    );
  }

  if (state.status === 'error' || state.data.revisions.length === 0) {
    const kind = state.status === 'error' ? state.kind : 'not-found';
    const canRetry = kind !== 'forbidden' && kind !== 'not-found';
    return (
      <SectionBox title={name} backLink={backLink}>
        <Alert
          severity={canRetry ? 'error' : 'info'}
          action={
            canRetry ? (
              <Button color="inherit" size="small" onClick={reload}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {describeFailure(kind, namespace, name)}
        </Alert>
      </SectionBox>
    );
  }

  const { revisions, unreadable } = state.data;
  const current = revisions[0];
  const selected = revisions.find(revision => revision.revision === selectedRevision) ?? current;

  return (
    <>
      <SectionBox
        title={
          <SectionHeader headerStyle="subsection" title={<ReleaseTitle release={current} />} />
        }
        backLink={backLink}
      >
        <NameValueTable
          rows={[
            { name: 'Namespace', value: current.namespace },
            { name: 'Status', value: <ReleaseStatus status={current.status} /> },
            { name: 'Chart', value: chartLabel(current) },
            { name: 'App version', value: current.appVersion, hide: !current.appVersion },
            { name: 'Revision', value: current.revision },
            { name: 'First deployed', value: <ReleaseDate date={current.firstDeployed} /> },
            { name: 'Last deployed', value: <ReleaseDate date={current.updated} /> },
            { name: 'Description', value: current.description, hide: !current.description },
            {
              name: 'Chart description',
              value: current.chartDescription,
              hide: !current.chartDescription,
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="Revision history">
        {unreadable > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {`${plural(unreadable, 'revision record')} could not be read and ${
              unreadable === 1 ? 'is' : 'are'
            } not listed.`}
          </Alert>
        )}
        <RevisionHistory revisions={revisions} selected={selected} onSelect={setSelectedRevision} />
      </SectionBox>

      <RevisionExplorer revision={selected} revisions={revisions} />
    </>
  );
}
