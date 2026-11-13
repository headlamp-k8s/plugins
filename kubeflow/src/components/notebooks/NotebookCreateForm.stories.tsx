import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { getDefaultNotebookFormValues, NotebookFormValues } from './notebookCreate';
import { NotebookCreateForm, NotebookCreateFormProps } from './NotebookCreateDialog';

const namespaces = ['default', 'kubeflow', 'kubeflow-user'];
const podDefaults = [
  { label: 'access-ml-pipeline', description: 'Allow access to Kubeflow Pipelines' },
  { label: 'add-gcp-secret', description: 'Add GCP credentials' },
];

/** Keeps the form's values in state, so the story can be edited in Storybook. */
function StatefulForm(props: NotebookCreateFormProps) {
  const [values, setValues] = React.useState<NotebookFormValues>(props.values);
  return <NotebookCreateForm {...props} values={values} onChange={setValues} />;
}

const meta: Meta<typeof NotebookCreateForm> = {
  title: 'Kubeflow/Notebooks/NotebookCreateForm',
  component: NotebookCreateForm,
  render: args => <StatefulForm {...args} />,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
  args: {
    values: getDefaultNotebookFormValues(),
    errors: {},
    onChange: () => {},
    namespaces,
    claimNames: [],
    podDefaults: [],
  },
  parameters: {
    docs: {
      description: {
        component:
          'Fields of the "New Notebook" dialog. The defaults follow the Kubeflow Notebooks web app.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebookCreateForm>;

/** The form as it opens: web app defaults, no namespace selected yet. */
export const Default: Story = {};

export const Filled: Story = {
  args: {
    values: {
      ...getDefaultNotebookFormValues('kubeflow-user'),
      name: 'my-notebook',
      podDefaultLabels: ['access-ml-pipeline'],
    },
    claimNames: ['shared-data'],
    podDefaults,
  },
};

export const ValidationErrors: Story = {
  args: {
    values: {
      ...getDefaultNotebookFormValues(),
      name: 'My_Notebook',
      cpu: '2',
      cpuLimit: '1',
      memoryGi: 'abc',
    },
    errors: {
      name: 'invalidName',
      namespace: 'required',
      cpuLimit: 'limitBelowRequest',
      memoryGi: 'notPositiveNumber',
    },
  },
};

export const VSCodeWithGPU: Story = {
  args: {
    values: {
      ...getDefaultNotebookFormValues('kubeflow-user'),
      name: 'vscode-gpu',
      serverType: 'group-one',
      image: 'ghcr.io/kubeflow/kubeflow/notebook-servers/codeserver-python:latest',
      gpuVendor: 'nvidia.com/gpu',
      gpuCount: '2',
    },
    podDefaults,
  },
};

export const ExistingWorkspace: Story = {
  args: {
    values: {
      ...getDefaultNotebookFormValues('kubeflow-user'),
      name: 'my-notebook',
      workspace: {
        type: 'existing',
        claimName: 'shared-data',
        sizeGi: '5',
        mountPath: '/home/jovyan',
      },
    },
    claimNames: ['shared-data', 'datasets'],
  },
};

export const NoWorkspace: Story = {
  args: {
    values: {
      ...getDefaultNotebookFormValues('kubeflow-user'),
      name: 'scratch',
      workspace: { type: 'none', claimName: '', sizeGi: '5', mountPath: '/home/jovyan' },
    },
  },
};

/** While the notebook is being created, every field is disabled. */
export const Saving: Story = {
  args: {
    values: { ...getDefaultNotebookFormValues('kubeflow-user'), name: 'my-notebook' },
    podDefaults,
    disabled: true,
  },
};
