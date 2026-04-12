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
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { KubeflowConditionsSection } from '../common/KubeflowConditionsSection';
import { PipelineStatusBadge } from '../common/PipelineStatusBadge';
import {
  getPipelineDetailsPath,
  getPipelineVersionDetailsPath,
  getPipelineVersionsForPipeline,
  hasPipelineVersionSource,
} from '../common/pipelineUtils';
import { TestProvider } from '../common/TestProvider';
import { allVersions, mockVersion } from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single Pipeline Version detail.
 * Decoupled from Headlamp's DetailsGrid to avoid redundant Redux dependencies in Storybook.
 */
function PipelineVersionsDetailContent(props: { version: any; allVersions: any[] }) {
  const { version: rawVersion, allVersions: rawVersions } = props;
  const item = new PipelineVersionClass(rawVersion);
  const versions = rawVersions.map(v => new PipelineVersionClass(v));

  const siblingVersions = getPipelineVersionsForPipeline(
    versions,
    item.pipelineName,
    item.metadata.namespace
  ).filter(version => version.metadata.name !== item.metadata.name);

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
            name: 'Spec Name',
            value: item.pipelineSpecName || '-',
          },
          {
            name: 'SDK Version',
            value: item.pipelineSdkVersion || '-',
          },
          {
            name: 'Phase',
            value: item.phase || '-',
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
            name: 'Source',
            value: hasPipelineVersionSource(item) ? item.sourceValue || item.sourceLabel : '-',
          },
        ]}
      />

      {hasPipelineVersionSource(item) && (
        <SectionBox title="Source Details">
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
                label: 'Source Type',
                value: item.sourceLabel,
              },
              {
                label: 'Pipeline Spec URI',
                value: item.spec.pipelineSpecURI || '-',
              },
              {
                label: 'Code Source URL',
                value: item.spec.codeSourceURL || '-',
              },
              {
                label: 'Embedded Pipeline Name',
                value: item.pipelineSpecName || '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {item.pipelineSpec && (
        <SectionBox title="Pipeline Spec Summary">
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
                label: 'Spec Name',
                value: item.pipelineSpecName || '-',
              },
              {
                label: 'Spec Description',
                value: item.pipelineSpecDescription || '-',
              },
              {
                label: 'SDK Version',
                value: item.pipelineSdkVersion || '-',
              },
              {
                label: 'Tasks',
                value: item.taskNames.length > 0 ? item.taskNames.join(', ') : '-',
              },
              {
                label: 'Executors',
                value: item.executorNames.length > 0 ? item.executorNames.join(', ') : '-',
              },
            ]}
          />
        </SectionBox>
      )}

      {siblingVersions.length > 0 && (
        <SectionBox title="Other Versions in This Pipeline">
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
            data={siblingVersions}
            emptyMessage="No other versions found."
          />
        </SectionBox>
      )}

      {item.conditions.length > 0 && <KubeflowConditionsSection conditions={item.conditions} />}

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

const meta: Meta<typeof PipelineVersionsDetailContent> = {
  title: 'Kubeflow/Pipelines/PipelineVersionsDetail',
  component: PipelineVersionsDetailContent,
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
        component: 'Detail view for a Kubeflow Pipeline Version showing parent pipeline and spec.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineVersionsDetailContent>;

export const Default: Story = {
  args: {
    version: mockVersion,
    allVersions: allVersions,
  },
};
