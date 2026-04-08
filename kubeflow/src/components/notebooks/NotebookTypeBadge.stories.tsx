import type { Meta, StoryObj } from '@storybook/react';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';

const meta: Meta<typeof NotebookTypeBadge> = {
  title: 'Kubeflow/Badges/NotebookTypeBadge',
  component: NotebookTypeBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Badge that derives the notebook flavor (Jupyter / VS Code / RStudio / Custom) from the container image string.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebookTypeBadge>;

export const Jupyter: Story = {
  args: { image: 'kubeflownotebookswg/jupyter-scipy:v1.8.0' },
};

export const VSCode: Story = {
  args: { image: 'kubeflownotebookswg/codeserver-python:v1.8.0' },
};

export const RStudio: Story = {
  args: { image: 'kubeflownotebookswg/rstudio-tidyverse:v1.8.0' },
};

export const Custom: Story = {
  args: { image: 'my-registry/custom-ml:v2' },
};

export const EmptyImage: Story = {
  args: { image: '' },
};
