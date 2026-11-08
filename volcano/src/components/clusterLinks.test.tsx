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

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// One object of each kind, all from cluster-b, which is not the first selected cluster.
const { job, jobTemplate, podGroup, queue } = vi.hoisted(() => {
  const metadata = (name: string, namespace?: string) => ({
    name,
    namespace,
    creationTimestamp: '2026-11-01T00:00:00Z',
  });
  return {
    job: {
      cluster: 'cluster-b',
      queue: 'team-q',
      phase: 'Pending',
      metadata: metadata('train-1', 'volcano-test'),
      status: {},
      getName: () => 'train-1',
      getNamespace: () => 'volcano-test',
      getCreationTs: () => '2026-11-01T00:00:00Z',
    },
    jobTemplate: {
      cluster: 'cluster-b',
      queue: 'team-q',
      metadata: metadata('template-1', 'volcano-test'),
    },
    podGroup: {
      cluster: 'cluster-b',
      queue: 'team-q',
      phase: 'Pending',
      metadata: metadata('pg-1', 'volcano-test'),
      status: {},
      getName: () => 'pg-1',
      getNamespace: () => 'volcano-test',
      getCreationTs: () => '2026-11-01T00:00:00Z',
    },
    queue: {
      cluster: 'cluster-b',
      state: 'Closed',
      spec: { parent: 'team-q' },
      metadata: metadata('child-q'),
      status: {},
      getName: () => 'child-q',
    },
  };
});

vi.mock('../resources/job', () => ({
  VolcanoJob: { testItem: job, useList: () => [[job], null] },
}));
vi.mock('../resources/jobtemplate', () => ({ VolcanoJobTemplate: { testItem: jobTemplate } }));
vi.mock('../resources/podgroup', () => ({
  VolcanoPodGroup: { testItem: podGroup, useList: () => [[podGroup], null] },
}));
vi.mock('../resources/queue', () => ({
  VolcanoQueue: { testItem: queue, useList: () => [[queue], null] },
}));

vi.mock('./common/CommonComponents', () => ({
  VolcanoCoreInstallCheck: (props: { children: React.ReactNode }) => <>{props.children}</>,
  VolcanoFlowInstallCheck: (props: { children: React.ReactNode }) => <>{props.children}</>,
}));
vi.mock('./overview/OverviewCards', () => ({ SummaryCard: () => null }));

// The tables render each column for the test object of their resource class, so the test sees
// the links the real columns build.
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: (props: {
    routeName: string;
    params: Record<string, string>;
    activeCluster?: string;
    children?: React.ReactNode;
  }) => (
    <a
      href={`/${props.routeName}/${Object.values(props.params).join('/')}`}
      data-active-cluster={props.activeCluster ?? ''}
    >
      {props.children}
    </a>
  ),
  ResourceListView: (props: {
    resourceClass: { testItem: object };
    columns: Array<string | { render?: (item: any) => React.ReactNode }>;
  }) => (
    <>
      {props.columns.map((column, index) =>
        typeof column === 'object' && column.render ? (
          <div key={index}>{column.render(props.resourceClass.testItem)}</div>
        ) : null
      )}
    </>
  ),
  SimpleTable: (props: {
    data: object[];
    columns: Array<{ getter: (item: any) => React.ReactNode }>;
  }) => (
    <>
      {props.data.map((item, row) =>
        props.columns.map((column, index) => (
          <div key={`${row}-${index}`}>{column.getter(item)}</div>
        ))
      )}
    </>
  ),
  SectionBox: (props: { children: React.ReactNode }) => <>{props.children}</>,
  StatusLabel: (props: { children: React.ReactNode }) => <>{props.children}</>,
  DateLabel: () => null,
}));

import JobList from './jobs/List';
import JobTemplateList from './jobtemplates/List';
import Overview from './overview/Overview';
import PodGroupList from './podgroups/List';
import QueueList from './queues/List';

/** The clusters every rendered link opens in. */
function linkClusters() {
  return screen.getAllByRole('link').map(link => link.getAttribute('data-active-cluster'));
}

describe('Volcano links with more than one cluster selected', () => {
  it.each([
    ['Jobs', JobList],
    ['Job Templates', JobTemplateList],
    ['PodGroups', PodGroupList],
    ['Queues', QueueList],
  ])('opens the Queue links of the %s list in the cluster of the item', (_, List) => {
    render(<List />);

    expect(screen.getByRole('link', { name: 'team-q' }).getAttribute('href')).toBe(
      '/volcano-queue-detail/team-q'
    );
    expect(linkClusters()).toEqual(['cluster-b']);
  });

  it('opens every Job, PodGroup and Queue link of the overview in the cluster of the item', () => {
    render(<Overview />);

    // Needs attention: train-1, pg-1 and their queue, and child-q. Recent Jobs and recent
    // PodGroups: the item and its queue.
    const clusters = linkClusters();
    expect(clusters).toHaveLength(9);
    expect(new Set(clusters)).toEqual(new Set(['cluster-b']));
  });
});
