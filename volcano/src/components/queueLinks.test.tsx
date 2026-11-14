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

import { render } from '@testing-library/react';
import type React from 'react';
import { vi } from 'vitest';

const captured = vi.hoisted(() => ({
  links: [] as Array<Record<string, any>>,
  columns: [] as Array<any>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: (props: Record<string, any>) => {
    captured.links.push(props);
    return null;
  },
  StatusLabel: () => null,
  ResourceListView: (props: { columns: Array<any> }) => {
    captured.columns = props.columns;
    return null;
  },
}));

// The lists only pass these classes on as `resourceClass`, and the real ones need Headlamp's runtime.
vi.mock('../resources/job', () => ({ VolcanoJob: class VolcanoJob {} }));
vi.mock('../resources/podgroup', () => ({ VolcanoPodGroup: class VolcanoPodGroup {} }));
vi.mock('../resources/jobtemplate', () => ({ VolcanoJobTemplate: class VolcanoJobTemplate {} }));

vi.mock('./common/CommonComponents', () => ({
  VolcanoCoreInstallCheck: ({ children }: { children: React.ReactNode }) => children,
  VolcanoFlowInstallCheck: ({ children }: { children: React.ReactNode }) => children,
}));

import JobList from './jobs/List';
import JobTemplateList from './jobtemplates/List';
import PodGroupList from './podgroups/List';

/** Renders a list page and then the Queue column cell for the given row. */
function renderQueueLink(List: React.ComponentType, row: object) {
  captured.links.length = 0;
  render(<List />);

  const queueColumn = captured.columns.find(column => column?.id === 'queue');
  render(<>{queueColumn.render(row)}</>);

  return captured.links[0];
}

describe('Queue links in the Volcano lists', () => {
  // With several clusters selected, a row's queue lives in the cluster the row
  // comes from. Without activeCluster the URL keeps the whole selection and
  // the queue page loads from the first selected cluster instead.
  it.each([
    ['Jobs', JobList],
    ['PodGroups', PodGroupList],
    ['JobTemplates', JobTemplateList],
  ])('%s link the queue in the cluster of the row', (_name, List) => {
    const link = renderQueueLink(List, { queue: 'team-q', cluster: 'cluster-b' });

    expect(link.params).toEqual({ name: 'team-q' });
    expect(link.activeCluster).toBe('cluster-b');
  });

  it("uses each row's own cluster, not the first selected one", () => {
    expect(renderQueueLink(JobList, { queue: 'team-q', cluster: 'cluster-a' }).activeCluster).toBe(
      'cluster-a'
    );
    expect(renderQueueLink(JobList, { queue: 'team-q', cluster: 'cluster-b' }).activeCluster).toBe(
      'cluster-b'
    );
  });
});
