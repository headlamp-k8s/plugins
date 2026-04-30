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
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineExperimentDetailsPath,
  getPipelineRunDurationLabel,
  getPipelineVersionDetailsPath,
} from '../common/pipelineUtils';
import { TestProvider } from '../common/TestProvider';
import { allRuns, mockRun, mockRunFailed, mockRunRunning } from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Pipeline Run detail.
 * Decoupled from Headlamp's DetailsGrid to avoid redundant Redux dependencies in Storybook.
 */
function PipelineRunsDetailContent(props: { run: any }) {
  const { run: rawRun } = props;
  const item = new PipelineRunClass(rawRun);

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
            name: 'State',
            value: item.state || 'UNKNOWN',
          },
          {
            name: 'Duration',
            value: getPipelineRunDurationLabel(item),
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
          {
            name: 'Experiment',
            value: item.experimentName ? (
              <HeadlampLink
                routeName={getPipelineExperimentDetailsPath()}
                params={{ namespace: item.metadata.namespace, name: item.experimentName }}
              >
                {item.experimentName}
              </HeadlampLink>
            ) : (
              '-'
            ),
          },
        ]}
      />

      <SectionBox title="Orchestration Details">
        <SimpleTable
          columns={[
            {
              label: 'Field',
              getter: (row: { label: string }) => row.label,
            },
            {
              label: 'Value',
              getter: (row: { value: string }) => row.value,
            },
          ]}
          data={[
            {
              label: 'Run ID',
              value: item.metadata.name,
            },
            {
              label: 'Start Time',
              value: item.status.startTime || '-',
            },
            {
              label: 'Completion Time',
              value: item.status.completionTime || '-',
            },
            {
              label: 'Pipeline Root',
              value: item.pipelineRoot || '-',
            },
          ]}
        />
      </SectionBox>

      {item.conditions.length > 0 && (
        <SectionBox title="Conditions">
          <ConditionsTable resource={item.jsonData} />
        </SectionBox>
      )}

      <SectionBox title="Raw Spec Preview">
        <Box
          component="pre"
          sx={{
            margin: 0,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
          }}
        >
          {JSON.stringify(item.spec, null, 2)}
        </Box>
      </SectionBox>
    </Box>
  );
}

const meta: Meta<typeof PipelineRunsDetailContent> = {
  title: 'Kubeflow/Pipelines/PipelineRunsDetail',
  component: PipelineRunsDetailContent,
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
          'Detail view for a Kubeflow Pipeline Run showing status, orchestration details, and results.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineRunsDetailContent>;

export const Succeeded: Story = {
  args: {
    run: mockRun,
  },
};

export const Running: Story = {
  args: {
    run: mockRunRunning,
  },
};

export const Failed: Story = {
  args: {
    run: mockRunFailed,
  },
};

/** All runs comparison. */
export const All: Story = {
  render: () => (
    <>
      {allRuns.map(run => (
        <PipelineRunsDetailContent key={run.metadata.name} run={run} />
      ))}
    </>
  ),
};
