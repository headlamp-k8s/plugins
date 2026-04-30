import {
  ConditionsTable,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  countPipelineVersionsForPipeline,
  getPipelineVersionDetailsPath,
  getPipelineVersionsForPipeline,
} from '../common/pipelineUtils';
import { TestProvider } from '../common/TestProvider';
import {
  allPipelines,
  allVersions,
  mockPipeline,
  mockPipelineComplex,
} from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Pipeline detail.
 * Decoupled from Headlamp's DetailsGrid to avoid redundant Redux dependencies in Storybook.
 */
function PipelinesDetailContent(props: { pipeline: any; versions: any[] }) {
  const { pipeline: rawPipeline, versions: rawVersions } = props;
  const pipeline = new PipelineClass(rawPipeline);
  const versions = rawVersions.map(v => new PipelineVersionClass(v));

  const relatedVersions = getPipelineVersionsForPipeline(
    versions,
    pipeline.metadata.name,
    pipeline.metadata.namespace
  );

  const sortedVersions = [...relatedVersions].sort((left, right) => {
    const leftTimestamp = Date.parse(left.metadata.creationTimestamp ?? '');
    const rightTimestamp = Date.parse(right.metadata.creationTimestamp ?? '');
    return rightTimestamp - leftTimestamp;
  });

  const latestVersion = sortedVersions[0];
  const previousVersion = sortedVersions[1];

  return (
    <Box sx={{ padding: '24px 16px' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {pipeline.metadata.name}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {pipeline.metadata.namespace || 'All Namespaces'}
      </Typography>

      <NameValueTable
        rows={[
          {
            name: 'Status',
            value: <PipelineStatusBadge resource={pipeline} />,
          },
          {
            name: 'Display Name',
            value: pipeline.displayName || '-',
          },
          {
            name: 'Description',
            value: pipeline.description || '-',
          },
          {
            name: 'Package URL',
            value: pipeline.packageUrl || '-',
          },
          {
            name: 'SDK Version',
            value: pipeline.pipelineSdkVersion || '-',
          },
          {
            name: 'Spec Name',
            value: pipeline.pipelineSpecName || '-',
          },
          {
            name: 'Phase',
            value: pipeline.phase || '-',
          },
          {
            name: 'Related Versions',
            value: countPipelineVersionsForPipeline(
              versions,
              pipeline.metadata.name,
              pipeline.metadata.namespace
            ),
          },
          {
            name: 'Tasks',
            value: pipeline.taskNames.length > 0 ? pipeline.taskNames.length : '-',
          },
          {
            name: 'Executors',
            value: pipeline.executorNames.length > 0 ? pipeline.executorNames.length : '-',
          },
          {
            name: 'Latest Version',
            value: (() => {
              if (!latestVersion?.metadata?.name || !latestVersion.metadata.namespace) {
                return '-';
              }

              return (
                <HeadlampLink
                  routeName={getPipelineVersionDetailsPath()}
                  params={{
                    namespace: latestVersion.metadata.namespace,
                    name: latestVersion.metadata.name,
                  }}
                >
                  {latestVersion.metadata.name}
                </HeadlampLink>
              );
            })(),
          },
        ]}
      />

      <SectionBox title="Pipeline Definition">
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
              label: 'Package URL',
              value: pipeline.packageUrl || '-',
            },
            {
              label: 'SDK Version',
              value: pipeline.pipelineSdkVersion || '-',
            },
            {
              label: 'Spec Name',
              value: pipeline.pipelineSpecName || '-',
            },
            {
              label: 'Spec Description',
              value: pipeline.pipelineSpecDescription || '-',
            },
            {
              label: 'Tasks',
              value: pipeline.taskNames.length > 0 ? pipeline.taskNames.join(', ') : '-',
            },
            {
              label: 'Executors',
              value: pipeline.executorNames.length > 0 ? pipeline.executorNames.join(', ') : '-',
            },
          ]}
        />
      </SectionBox>

      {relatedVersions.length > 0 && (
        <SectionBox title="Related Pipeline Versions">
          <SimpleTable
            columns={[
              {
                label: 'Name',
                getter: (version: PipelineVersionClass) => (
                  <HeadlampLink
                    routeName={getPipelineVersionDetailsPath()}
                    params={{
                      namespace: version.metadata.namespace,
                      name: version.metadata.name,
                    }}
                  >
                    {version.metadata.name}
                  </HeadlampLink>
                ),
              },
              {
                label: 'Display Name',
                getter: (version: PipelineVersionClass) => version.displayName || '-',
              },
              {
                label: 'Description',
                getter: (version: PipelineVersionClass) => version.description || '-',
              },
              {
                label: 'Status',
                getter: (version: PipelineVersionClass) => (
                  <PipelineStatusBadge resource={version} />
                ),
              },
            ]}
            data={relatedVersions}
            emptyMessage="No related pipeline versions found."
          />
        </SectionBox>
      )}

      {latestVersion && previousVersion && (
        <SectionBox title="Latest vs Previous Version">
          <Grid container spacing={2}>
            {[latestVersion, previousVersion].map(version => (
              <Grid item xs={12} md={6} key={version.metadata.name}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {version.metadata.name}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    margin: 0,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    backgroundColor: 'action.hover',
                    padding: 1.5,
                    borderRadius: '4px',
                  }}
                >
                  {JSON.stringify(version.spec, null, 2)}
                </Box>
              </Grid>
            ))}
          </Grid>
        </SectionBox>
      )}

      {pipeline.conditions.length > 0 && (
        <SectionBox title="Conditions">
          <ConditionsTable resource={pipeline.jsonData} />
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
          {JSON.stringify(pipeline.spec, null, 2)}
        </Box>
      </SectionBox>
    </Box>
  );
}

const meta: Meta<typeof PipelinesDetailContent> = {
  title: 'Kubeflow/Pipelines/PipelinesDetail',
  component: PipelinesDetailContent,
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
          'Detail view for a Kubeflow Pipeline showing definition, related versions, and raw spec.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelinesDetailContent>;

export const Default: Story = {
  args: {
    pipeline: mockPipeline,
    versions: allVersions,
  },
};

export const Complex: Story = {
  args: {
    pipeline: mockPipelineComplex,
    versions: allVersions,
  },
};

/** All pipelines rendered for comparison. */
export const All: Story = {
  render: () => (
    <>
      {allPipelines.map(p => (
        <PipelinesDetailContent key={p.metadata.name} pipeline={p} versions={allVersions} />
      ))}
    </>
  ),
};
