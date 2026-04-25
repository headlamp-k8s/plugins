import {
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PipelineRecurringRunClass } from '../../resources/pipelineRecurringRun';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { KubeflowConditionsSection } from '../common/KubeflowConditionsSection';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineRunDetailsPath,
  getPipelineVersionDetailsPath,
  getRecurringRunSchedule,
} from '../common/pipelineUtils';
import { TestProvider } from '../common/TestProvider';
import { allRuns, mockRecurringRun, mockRecurringRunDisabled } from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Pipeline Recurring Run detail.
 * Decoupled from Headlamp's DetailsGrid to avoid redundant Redux dependencies in Storybook.
 */
function PipelineRecurringRunsDetailContent(props: { recurringRun: any; runs: any[] }) {
  const { recurringRun: rawRecurringRun, runs: rawRuns } = props;
  const item = new PipelineRecurringRunClass(rawRecurringRun);
  const runs = rawRuns.map(r => new PipelineRunClass(r));

  return (
    <Box sx={{ padding: '24px 16px' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {item.metadata.name}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {item.metadata.namespace}
      </Typography>

      <NameValueTable
        rows={[
          {
            name: 'Status',
            value: <PipelineStatusBadge resource={item} />,
          },
          {
            name: 'Mode',
            value: item.mode || 'UNKNOWN',
          },
          {
            name: 'Schedule',
            value: getRecurringRunSchedule(item),
          },
          {
            name: 'Parent Pipeline',
            value: item.pipelineName ? (
              <HeadlampLink
                routeName={getPipelineDetailsPath()}
                params={{ namespace: item.metadata.namespace, name: item.pipelineName }}
              >
                {item.pipelineName}
              </HeadlampLink>
            ) : (
              '-'
            ),
          },
          {
            name: 'Pipeline Version',
            value: item.pipelineVersionName ? (
              <HeadlampLink
                routeName={getPipelineVersionDetailsPath()}
                params={{ namespace: item.metadata.namespace, name: item.pipelineVersionName }}
              >
                {item.pipelineVersionName}
              </HeadlampLink>
            ) : (
              '-'
            ),
          },
        ]}
      />

      <SectionBox title="Associated Pipeline Runs">
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (run: PipelineRunClass) => (
                <HeadlampLink
                  routeName={getPipelineRunDetailsPath()}
                  params={{
                    namespace: run.metadata.namespace,
                    name: run.metadata.name,
                  }}
                >
                  {run.metadata.name}
                </HeadlampLink>
              ),
            },
            {
              label: 'Status',
              getter: (run: PipelineRunClass) => <PipelineStatusBadge resource={run} />,
            },
          ]}
          data={runs}
          emptyMessage="No runs found for this schedule."
        />
      </SectionBox>

      {item.conditions.length > 0 && <KubeflowConditionsSection conditions={item.conditions} />}
    </Box>
  );
}

const meta: Meta<typeof PipelineRecurringRunsDetailContent> = {
  title: 'Kubeflow/Pipelines/PipelineRecurringRunsDetail',
  component: PipelineRecurringRunsDetailContent,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Detail view for a Kubeflow Pipeline Recurring Run showing schedule and associated runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineRecurringRunsDetailContent>;

export const Enabled: Story = {
  args: {
    recurringRun: mockRecurringRun,
    runs: allRuns,
  },
};

export const Disabled: Story = {
  args: {
    recurringRun: mockRecurringRunDisabled,
    runs: [],
  },
};
