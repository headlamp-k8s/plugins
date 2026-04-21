/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { getPipelineRunDetailsPath, getPipelineRunRoot } from '../common/pipelineUtils';
import { SectionPage } from '../common/SectionPage';

/**
 * Aggregated metrics for a distinct pipeline root URI.
 */
interface PipelineRootSummary {
  /** The fully qualified pipeline root (e.g. s3://bucket/path, minio://...) */
  root: string;
  /** Total number of pipeline runs discovered using this exact root */
  runs: number;
  /** The set of namespaces containing runs utilizing this root */
  namespaces: Set<string>;
  /** The single most recent pipeline run associated with this root */
  latestRun?: PipelineRunClass;
}

function parseCreationTimestamp(timestamp?: string): number {
  const parsed = Date.parse(timestamp ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Helper to sort resources descending by their creation timestamp.
 * Objects missing a timestamp will fall back to the epoch (parse as NaN/0 respectively).
 */
function sortByCreationTimestampDesc<T extends { metadata: { creationTimestamp?: string } }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const leftTimestamp = parseCreationTimestamp(left.metadata.creationTimestamp);
    const rightTimestamp = parseCreationTimestamp(right.metadata.creationTimestamp);
    return rightTimestamp - leftTimestamp;
  });
}

/**
 * Lists pipeline roots discovered across recent runs.
 */
export function PipelineArtifacts() {
  const [runs, runsError] = PipelineRunClass.useList();
  const runList = runs ?? [];

  const rootSummaries = React.useMemo(() => {
    const rootMap = new Map<string, PipelineRootSummary>();
    sortByCreationTimestampDesc(runList).forEach(run => {
      const root = getPipelineRunRoot(run);
      if (!root) {
        return;
      }

      const existing = rootMap.get(root) ?? {
        root,
        runs: 0,
        namespaces: new Set<string>(),
        latestRun: undefined,
      };

      existing.runs += 1;
      if (run.metadata.namespace) {
        existing.namespaces.add(run.metadata.namespace);
      }
      if (!existing.latestRun) {
        existing.latestRun = run;
      }

      rootMap.set(root, existing);
    });

    return Array.from(rootMap.values()).sort((left, right) => right.runs - left.runs);
  }, [runList]);

  return (
    <SectionPage
      title="Artifacts & Pipeline Root"
      apiPath="/apis/pipelines.kubeflow.org/v2beta1/runs"
    >
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          Artifacts & Pipeline Root
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
          Storage roots discovered from recent pipeline runs
        </Typography>

        <SectionBox title="Pipeline Roots in Use">
          <SimpleTable
            columns={[
              {
                label: 'Pipeline Root',
                getter: (row: PipelineRootSummary) => row.root,
              },
              {
                label: 'Runs',
                getter: (row: PipelineRootSummary) => row.runs,
              },
              {
                label: 'Namespaces',
                getter: (row: PipelineRootSummary) => row.namespaces.size,
              },
              {
                label: 'Latest Run',
                getter: (row: PipelineRootSummary) =>
                  row.latestRun ? (
                    <HeadlampLink
                      routeName={getPipelineRunDetailsPath()}
                      params={{
                        namespace: row.latestRun.metadata.namespace,
                        name: row.latestRun.metadata.name,
                      }}
                    >
                      {row.latestRun.metadata.name}
                    </HeadlampLink>
                  ) : (
                    '-'
                  ),
              },
            ]}
            data={rootSummaries}
            emptyMessage={
              runsError
                ? 'Pipeline runs are unavailable or not installed.'
                : 'No pipeline roots detected yet.'
            }
          />
        </SectionBox>
      </Box>
    </SectionPage>
  );
}
