import pauseIcon from '@iconify/icons-mdi/pause';
import playIcon from '@iconify/icons-mdi/play';
import { addIcon } from '@iconify/react';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useHistory } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { getConfigStore } from '../../../util';
import { DiskMetricsChart } from './DiskMetricsChart';

addIcon('mdi:pause', pauseIcon);
addIcon('mdi:play', playIcon);

interface StoryArgs {
  scenario: 'ready' | 'loading' | 'discovery-error' | 'missing';
}

function DiskMetricsStory({ scenario }: StoryArgs) {
  const history = useHistory();
  useEffect(() => {
    getConfigStore().set({
      'disk-chart-story': {
        isMetricsEnabled: true,
        autoDetect: scenario === 'loading' || scenario === 'discovery-error',
        address: scenario === 'missing' ? undefined : 'monitoring/prometheus:9090',
        defaultTimespan: '6h',
        defaultResolution: 'high',
      },
    });
    history.replace('/c/disk-chart-story/storage/persistentvolumeclaims/default/data');
  }, [history, scenario]);

  return (
    <DiskMetricsChart
      usageQuery="kubelet_volume_stats_used_bytes"
      capacityQuery="kubelet_volume_stats_capacity_bytes"
    />
  );
}

const metricsHandler = http.get(/\/api\/v1\/query_range/, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const start = Number(params.get('start'));
  const end = Number(params.get('end'));
  const capacity = params.get('query')?.includes('capacity');
  return HttpResponse.json({
    status: 'success',
    data: {
      result: [
        {
          metric: {},
          values: Array.from({ length: 31 }, (_, index) => [
            start + ((end - start) * index) / 30,
            String(capacity ? 10 * 1024 ** 3 : (3 + Math.sin(index / 4)) * 1024 ** 3),
          ]),
        },
      ],
    },
  });
});

const meta = {
  title: 'Charts/DiskMetricsChart',
  args: { scenario: 'ready' },
  argTypes: { scenario: { control: false } },
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    ),
  ],
  parameters: { msw: { handlers: { story: [metricsHandler] } } },
  render: args => <DiskMetricsStory {...args} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PerViewOverrides: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('combobox', { name: 'Timespan' }));
    await userEvent.click(await page.findByRole('option', { name: '30 minutes' }));
    await userEvent.click(canvas.getByRole('combobox', { name: 'Resolution' }));
    await userEvent.click(await page.findByRole('option', { name: '10s' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
    await expect(canvas.getByRole('combobox', { name: 'Timespan' })).toHaveTextContent(
      '30 minutes'
    );
    await expect(canvas.getByRole('combobox', { name: 'Resolution' })).toHaveTextContent('10s');
    await expect(canvas.getByRole('button', { name: 'Resume' })).toBeVisible();
  },
};

export const Narrow: Story = {
  decorators: [
    Story => (
      <Box sx={{ width: 360, maxWidth: '100%' }}>
        <Story />
      </Box>
    ),
  ],
};

export const Loading: Story = {
  args: { scenario: 'loading' },
  parameters: {
    msw: {
      handlers: {
        story: [
          http.get(/\/api\/v1\/pods/, async () => {
            await delay('infinite');
            return HttpResponse.json({});
          }),
        ],
      },
    },
  },
};

export const DiscoveryError: Story = {
  args: { scenario: 'discovery-error' },
  parameters: {
    msw: {
      handlers: {
        story: [http.get(/\/api\/v1\/pods/, () => HttpResponse.json({}, { status: 403 }))],
      },
    },
  },
};

export const MissingPrometheus: Story = { args: { scenario: 'missing' } };

export const MetricsError: Story = {
  parameters: {
    msw: {
      handlers: {
        story: [http.get(/\/api\/v1\/query_range/, () => HttpResponse.error())],
      },
    },
  },
};
