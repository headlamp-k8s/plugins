import {
  ConditionsTable,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PipelineExperimentClass } from '../../resources/pipelineExperiment';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import { getPipelineRunDetailsPath } from '../common/pipelineUtils';
import { TestProvider } from '../common/TestProvider';
import { allRuns, mockExperiment } from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Pipeline Experiment detail.
 * Decoupled from Headlamp's DetailsGrid to avoid redundant Redux dependencies in Storybook.
 */
function PipelineExperimentsDetailContent(props: { experiment: any; runs: any[] }) {
  const { experiment: rawExperiment, runs: rawRuns } = props;
  const item = new PipelineExperimentClass(rawExperiment);
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
            name: 'Display Name',
            value: item.displayName || '-',
          },
          {
            name: 'Description',
            value: item.description || '-',
          },
          {
            name: 'Runs Count',
            value: runs.length,
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
          emptyMessage="No runs found for this experiment."
        />
      </SectionBox>

      {item.conditions.length > 0 && (
        <SectionBox title="Conditions">
          <ConditionsTable resource={item.jsonData} />
        </SectionBox>
      )}
    </Box>
  );
}

const meta: Meta<typeof PipelineExperimentsDetailContent> = {
  title: 'Kubeflow/Pipelines/PipelineExperimentsDetail',
  component: PipelineExperimentsDetailContent,
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
        component: 'Detail view for a Kubeflow Pipeline Experiment showing associated runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineExperimentsDetailContent>;

export const Default: Story = {
  args: {
    experiment: mockExperiment,
    runs: allRuns,
  },
};
