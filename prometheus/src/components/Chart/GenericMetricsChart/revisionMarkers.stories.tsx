import warningIcon from '@iconify/icons-mdi/alert-circle-outline';
import minimizeIcon from '@iconify/icons-mdi/chevron-up';
import pauseIcon from '@iconify/icons-mdi/pause';
import playIcon from '@iconify/icons-mdi/play';
import { addIcon } from '@iconify/react';
import { ConfigStore, K8s } from '@kinvolk/headlamp-plugin/lib';
import { darkTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { ThemeProvider } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';
import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useHistory } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { getConfigStore } from '../../../util';
import { GenericMetricsChart } from './GenericMetricsChart';
import { createStoryMetricValues, createStoryTimeline } from './revisionMarkers.storyData';

addIcon('mdi:pause', pauseIcon);
addIcon('mdi:play', playIcon);
addIcon('mdi:alert-circle-outline', warningIcon);
addIcon('mdi:chevron-up', minimizeIcon);

const timeline = createStoryTimeline(Math.floor(Date.now() / 1000));

interface StoryArgs {
  kind: 'Deployment' | 'StatefulSet' | 'DaemonSet';
}

const workloads = {
  Deployment: {
    name: 'checkout-api',
    revisions: [
      { revision: 41, hash: '6d7f8b9b6c' },
      { revision: 42, hash: '7c8f6bb995' },
    ],
  },
  StatefulSet: {
    name: 'orders-postgres',
    revisions: [
      { revision: 12, hash: '6db789b76f' },
      { revision: 13, hash: '5d8966bc78' },
    ],
  },
  DaemonSet: {
    name: 'fluent-bit',
    revisions: [
      { revision: 7, hash: '84b7d9bb96' },
      { revision: 8, hash: '59c6d9fcbb' },
    ],
  },
};

function MarkerStory({ kind }: StoryArgs) {
  const history = useHistory();
  const resource = useMemo(() => {
    const Resource = K8s.ResourceClasses[kind];
    const workload = workloads[kind];
    return new Resource(
      {
        ...Resource.getBaseObject(),
        apiVersion: 'apps/v1',
        kind,
        metadata: {
          name: workload.name,
          namespace: 'apps',
          uid: `${kind}-uid`,
          resourceVersion: '1',
          creationTimestamp: '2026-11-13T18:00:00Z',
        },
        spec: {
          selector: { matchLabels: { app: workload.name } },
          updateStrategy: {
            type: 'RollingUpdate',
            rollingUpdate: { partition: 0, maxUnavailable: 1 },
          },
          template: { spec: { containers: [], nodeName: '' } },
        },
        status: {},
      },
      'revision-chart-story'
    );
  }, [kind]);
  useEffect(() => {
    getConfigStore().set({
      'revision-chart-story': {
        isMetricsEnabled: true,
        autoDetect: false,
        address: 'monitoring/prometheus:9090',
        defaultTimespan: '6h',
        defaultResolution: 'high',
      },
    });
    history.replace(
      `/c/revision-chart-story/${K8s.ResourceClasses[kind].apiName}/apps/${workloads[kind].name}`
    );
  }, [history, kind]);
  return (
    <GenericMetricsChart
      resource={resource}
      cpuQuery="cpu"
      memoryQuery="memory"
      networkRxQuery="receive"
      networkTxQuery="transmit"
      filesystemReadQuery="read"
      filesystemWriteQuery="write"
    />
  );
}

function revisions(kind: StoryArgs['kind']) {
  const workload = workloads[kind];
  return workload.revisions.map(({ revision, hash }, index) => ({
    apiVersion: 'apps/v1',
    kind: kind === 'Deployment' ? 'ReplicaSet' : 'ControllerRevision',
    metadata: {
      name: `${workload.name}-${hash}`,
      namespace: 'apps',
      uid: `${kind}-${revision}`,
      labels: {
        app: workload.name,
        [kind === 'Deployment' ? 'pod-template-hash' : 'controller.kubernetes.io/hash']: hash,
      },
      creationTimestamp: new Date(timeline.revisionCreatedAt[index] * 1000).toISOString(),
      annotations:
        kind === 'Deployment'
          ? { 'deployment.kubernetes.io/revision': String(revision) }
          : undefined,
      ownerReferences: [
        {
          apiVersion: 'apps/v1',
          kind,
          name: workload.name,
          uid: `${kind}-uid`,
          controller: true,
          blockOwnerDeletion: true,
        },
      ],
    },
    revision,
    spec: { template: { spec: { containers: [] } } },
    data: { spec: { template: { spec: { containers: [] } } } },
    status: {},
  }));
}

function longRevisionHistory(kind: StoryArgs['kind']) {
  const base = revisions(kind)[1];
  const hashes = [
    '6d7f8b9b6c',
    '7c8f6bb995',
    '58f6f785fb',
    '6c5d8fc97d',
    '5d8966bc78',
    '6db789b76f',
    '59c6d9fcbb',
    '84b7d9bb96',
    '7b965cbf75',
    '675bd68b8d',
    '5c7f68c9df',
    '6c85b77d56',
  ];
  return hashes.map((hash, index) => ({
    ...base,
    revision: 100 + index,
    metadata: {
      ...base.metadata,
      name: `${workloads[kind].name}-${hash}`,
      uid: `${kind}-${100 + index}`,
      annotations:
        kind === 'Deployment'
          ? { 'deployment.kubernetes.io/revision': String(100 + index) }
          : undefined,
      creationTimestamp: new Date(
        (timeline.revisionCreatedAt[1] - (hashes.length - index - 1) * 10) * 1000
      ).toISOString(),
    },
  }));
}

function rollbackRevisions(kind: StoryArgs['kind']) {
  const items = revisions(kind);
  const currentRevision = workloads[kind].revisions[1].revision + 1;
  return items.map((item, index) =>
    index === 0
      ? {
          ...item,
          revision: currentRevision,
          metadata: {
            ...item.metadata,
            annotations:
              kind === 'Deployment'
                ? {
                    ...item.metadata.annotations,
                    'deployment.kubernetes.io/revision': String(currentRevision),
                    'deployment.kubernetes.io/revision-history': String(
                      workloads[kind].revisions[0].revision
                    ),
                  }
                : item.metadata.annotations,
          },
        }
      : item
  );
}

const historyHandlers = [
  http.get(/\/replicasets/, () =>
    HttpResponse.json({
      kind: 'ReplicaSetList',
      metadata: { resourceVersion: '1' },
      items: revisions('Deployment'),
    })
  ),
  http.get(/\/controllerrevisions/, () =>
    HttpResponse.json({
      kind: 'ControllerRevisionList',
      metadata: { resourceVersion: '1' },
      items: [...revisions('StatefulSet'), ...revisions('DaemonSet')],
    })
  ),
];

const metricsHandler = http.get(/\/api\/v1\/query_range/, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const start = Number(params.get('start'));
  const end = Number(params.get('end'));
  const scale =
    params.get('query') === 'memory' ? 1024 ** 3 : params.get('query') === 'cpu' ? 1 : 1024 ** 2;
  return HttpResponse.json({
    status: 'success',
    data: {
      result: [
        {
          metric: {},
          values: createStoryMetricValues(start, end, timeline, scale),
        },
      ],
    },
  });
});

async function selectRange({ canvasElement }: { canvasElement: HTMLElement }, option = '6 hours') {
  const preferences = new ConfigStore<Record<string, boolean>>('prometheus:revisionWarnings');
  preferences.update({ 'revision-chart-story': false });
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole('combobox', { name: 'Timespan' }, { timeout: 15000 })
  );
  await userEvent.click(
    await within(canvasElement.ownerDocument.body).findByRole('option', { name: option })
  );
}

const meta = {
  title: 'Charts/WorkloadRevisionMarkers',
  args: { kind: 'Deployment' },
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    ),
  ],
  parameters: {
    msw: {
      handlers: {
        story: [metricsHandler, ...historyHandlers],
        translations: [
          http.get(/\/plugins\/prometheus\/locales\/.*\/translation\.json/, () =>
            HttpResponse.json({})
          ),
        ],
      },
    },
  },
  render: args => <MarkerStory {...args} />,
} satisfies Meta<StoryArgs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Deployment: Story = {
  play: async context => {
    await selectRange(context);
    await expect(
      await within(context.canvasElement).findByText(
        `r${workloads[context.args.kind].revisions[1].revision}`,
        {},
        { timeout: 15000 }
      )
    ).toBeVisible();
  },
};
export const StatefulSet: Story = { ...Deployment, args: { kind: 'StatefulSet' } };
export const DaemonSet: Story = { ...Deployment, args: { kind: 'DaemonSet' } };
export const MarkerTooltip: Story = {
  play: async context => {
    await selectRange(context);
    const canvas = within(context.canvasElement);
    const markerLabel = `r${workloads[context.args.kind].revisions[1].revision}`;
    const label = await canvas.findByText(markerLabel, {}, { timeout: 15000 });
    const marker = canvas.getByRole('button', { name: markerLabel });
    const line = marker.querySelector('line');
    if (!line) throw new Error('Missing marker line');
    for (const element of [label, line]) {
      const bounds = element.getBoundingClientRect();
      await userEvent.pointer({
        target: element,
        coords: { clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 },
      });
      await expect(
        await within(context.canvasElement.ownerDocument.body).findByRole('dialog')
      ).toHaveTextContent('not rollout completion');
    }
    const link = await within(context.canvasElement.ownerDocument.body).findByRole('link', {
      name: 'checkout-api-7c8f6bb995',
    });
    await expect(link).toHaveAttribute(
      'href',
      '/c/revision-chart-story/replicasets/apps/checkout-api-7c8f6bb995'
    );
    await userEvent.hover(link);
    await expect(link).toBeVisible();
  },
};
export const OverlappingRevisions: Story = {
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () => {
            const items = revisions('Deployment');
            items[0].metadata.creationTimestamp = items[1].metadata.creationTimestamp;
            return HttpResponse.json({ items });
          }),
        ],
      },
    },
  },
  play: async context => {
    await selectRange(context);
    await userEvent.hover(
      await within(context.canvasElement).findByRole(
        'button',
        { name: 'r41 +1' },
        { timeout: 15000 }
      )
    );
    const body = within(context.canvasElement.ownerDocument.body);
    const tooltip = await body.findByRole('dialog');
    await expect(tooltip).toHaveTextContent('Current revision: r41');
    await expect(tooltip).toHaveTextContent('Current revision: r42');
    await expect(body.getByRole('link', { name: 'checkout-api-6d7f8b9b6c' })).toBeVisible();
    await expect(body.getByRole('link', { name: 'checkout-api-7c8f6bb995' })).toBeVisible();
  },
};
export const KeyboardNavigation: Story = {
  ...OverlappingRevisions,
  play: async context => {
    await selectRange(context);
    const marker = await within(context.canvasElement).findByRole(
      'button',
      { name: 'r41 +1' },
      { timeout: 15000 }
    );
    marker.focus();
    await userEvent.keyboard('{Enter}');
    const body = within(context.canvasElement.ownerDocument.body);
    await body.findByRole('dialog', { name: 'r41 +1' });
    await waitFor(() =>
      expect(body.getByRole('link', { name: 'checkout-api-6d7f8b9b6c' })).toHaveFocus()
    );
    await userEvent.tab();
    await expect(body.getByRole('link', { name: 'checkout-api-7c8f6bb995' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(marker).toHaveFocus());
  },
};
export const DeploymentRollback: Story = {
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () =>
            HttpResponse.json({ items: rollbackRevisions('Deployment') })
          ),
          http.get(/\/controllerrevisions/, () =>
            HttpResponse.json({
              items: [...rollbackRevisions('StatefulSet'), ...rollbackRevisions('DaemonSet')],
            })
          ),
        ],
      },
    },
  },
  play: async context => {
    await selectRange(context);
    const revision = workloads[context.args.kind].revisions[1].revision + 1;
    const label = `r${revision} (${
      context.args.kind === 'Deployment' ? 'reused' : 'possible reuse'
    })`;
    const marker = await within(context.canvasElement).findByRole(
      'button',
      { name: label },
      { timeout: 15000 }
    );
    marker.focus();
    await userEvent.keyboard('{Enter}');
    const body = within(context.canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: label });
    await expect(dialog).toHaveTextContent(`Current revision: r${revision}`);
    await expect(dialog).toHaveTextContent('rollback time');
    if (context.args.kind === 'Deployment') {
      await expect(dialog).toHaveTextContent('Previously served revisions (retained): r41');
    } else {
      await expect(dialog).toHaveTextContent(
        'Possible reuse: revision order differs from creation order.'
      );
    }
  },
};
export const StatefulSetRollback: Story = { ...DeploymentRollback, args: { kind: 'StatefulSet' } };
export const DaemonSetRollback: Story = { ...DeploymentRollback, args: { kind: 'DaemonSet' } };
export const ScrollableHistory: Story = {
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () =>
            HttpResponse.json({ items: longRevisionHistory('Deployment') })
          ),
          http.get(/\/controllerrevisions/, () =>
            HttpResponse.json({
              items: [...longRevisionHistory('StatefulSet'), ...longRevisionHistory('DaemonSet')],
            })
          ),
        ],
      },
    },
  },
  play: async context => {
    await selectRange(context);
    const marker = await within(context.canvasElement).findByRole(
      'button',
      { name: 'r100 +11' },
      { timeout: 15000 }
    );
    await userEvent.keyboard('{Tab}');
    marker.focus();
    const body = within(context.canvasElement.ownerDocument.body);
    const preview = await body.findByRole('dialog', { name: 'r100 +11' });
    const previewRegion = within(preview).getByRole('region');
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(previewRegion.scrollTop).toBeGreaterThan(0));
    await userEvent.keyboard('{End}');
    await waitFor(() =>
      expect(
        Math.abs(
          previewRegion.scrollTop - (previewRegion.scrollHeight - previewRegion.clientHeight)
        )
      ).toBeLessThanOrEqual(1)
    );
    await userEvent.keyboard('{Home}');
    await expect(previewRegion.scrollTop).toBe(0);
    await expect(marker).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const dialog = await body.findByRole('dialog', { name: 'r100 +11' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const region = within(dialog).getByRole('region');
    await waitFor(() =>
      expect(
        within(dialog).queryAllByRole('link')[0] ??
          within(dialog).getByRole('button', { name: 'Close' })
      ).toHaveFocus()
    );
    await userEvent.keyboard('{End}');
    await waitFor(() =>
      expect(
        Math.abs(region.scrollTop - (region.scrollHeight - region.clientHeight))
      ).toBeLessThanOrEqual(1)
    );
    await expect(
      within(dialog).getAllByText(
        'Markers show retained revision object creation times, not rollout completion.'
      )
    ).toHaveLength(1);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(marker).toHaveFocus());
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.keyboard('{Enter}');
    const reopened = await body.findByRole('dialog', { name: 'r100 +11' });
    await waitFor(() =>
      expect(
        within(reopened).queryAllByRole('link')[0] ??
          within(reopened).getByRole('button', { name: 'Close' })
      ).toHaveFocus()
    );
    await userEvent.keyboard('{End}');
  },
};
export const ScrollableHistoryNoLinks: Story = {
  ...ScrollableHistory,
  args: { kind: 'StatefulSet' },
};
export const ScrollableHistoryDark: Story = {
  ...ScrollableHistory,
  decorators: [
    Story => (
      <ThemeProvider theme={createMuiTheme(darkTheme)}>
        <Story />
      </ThemeProvider>
    ),
  ],
};
export const HourlyRevisions: Story = {
  decorators: [
    Story => (
      <div style={{ maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () => {
            const base = revisions('Deployment')[1];
            const hashes = ['6d7f8b9b6c', '7c8f6bb995', '58f6f785fb', '6c5d8fc97d'];
            const items = hashes.map((hash, index) => ({
              ...base,
              revision: 100 + index,
              metadata: {
                ...base.metadata,
                name: `checkout-api-${hash}`,
                uid: `Deployment-${100 + index}`,
                labels: { ...base.metadata.labels, 'pod-template-hash': hash },
                annotations: { 'deployment.kubernetes.io/revision': String(100 + index) },
                creationTimestamp: new Date(
                  (timeline.revisionCreatedAt[1] - (3 - index) * 3600) * 1000
                ).toISOString(),
              },
            }));
            return HttpResponse.json({ items });
          }),
        ],
      },
    },
  },
  play: async context => {
    await selectRange(context, '24 hours');
    await expect(
      await within(context.canvasElement).findByRole(
        'button',
        { name: 'r100 +3' },
        { timeout: 15000 }
      )
    ).toBeVisible();
  },
};
export const Loading: Story = {
  play: selectRange,
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, async () => {
            await delay('infinite');
            return HttpResponse.json({});
          }),
        ],
      },
    },
  },
};
export const ForbiddenHistory: Story = {
  play: async context => {
    await selectRange(context);
    await expect(
      await within(context.canvasElement).findByRole('button', {
        name: 'Minimize revision marker warning',
      })
    ).toBeVisible();
    await expect(within(context.canvasElement).getByText('Technical details')).toBeVisible();
  },
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () =>
            HttpResponse.json(
              {
                message:
                  'replicasets.apps is forbidden: User "read-only-user" cannot list resource "replicasets" in API group "apps" in the namespace "apps"',
              },
              { status: 403 }
            )
          ),
        ],
      },
    },
  },
};
export const ForbiddenHistoryDetails: Story = {
  ...ForbiddenHistory,
  play: async context => {
    await selectRange(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(await canvas.findByText('Technical details'));
    await expect(
      await canvas.findByText(/Forbidden - replicasets.apps is forbidden/)
    ).toBeVisible();
  },
};
export const MinimizedHistoryWarning: Story = {
  ...ForbiddenHistory,
  play: async context => {
    await selectRange(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Minimize revision marker warning' })
    );
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Show revision marker warning' })
    ).toHaveFocus();
  },
};
export const EmptyHistory: Story = {
  play: selectRange,
  parameters: {
    msw: {
      handlers: {
        story: [
          metricsHandler,
          http.get(/\/replicasets/, () => HttpResponse.json({ kind: 'ReplicaSetList', items: [] })),
        ],
      },
    },
  },
};
