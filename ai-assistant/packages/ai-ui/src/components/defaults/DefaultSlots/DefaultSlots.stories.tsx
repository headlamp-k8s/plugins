import { DialogContent, DialogTitle, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DefaultActionButton,
  DefaultConfirmDialog,
  type DefaultConfirmDialogProps,
  DefaultContentRenderer,
  type DefaultContentRendererProps,
  DefaultDialog,
  DefaultEditorDialog,
  type DefaultEditorDialogProps,
  DefaultSectionWrapper,
  type DefaultSectionWrapperProps,
} from './DefaultSlots';

const meta = {
  title: 'AI UI/Defaults/DefaultSlots',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const actionButtonArgs = {
  description: 'Open settings',
  icon: 'mdi:cog',
  onClick: () => undefined,
};
export const ActionButton: Story = {
  render: () => <DefaultActionButton {...actionButtonArgs} />,
};

export const confirmDialogArgs: DefaultConfirmDialogProps = {
  open: true,
  handleClose: () => undefined,
  onConfirm: () => undefined,
  title: 'Delete resource?',
  description: 'This operation cannot be undone.',
};
export const ConfirmDialog: Story = {
  render: () => <DefaultConfirmDialog {...confirmDialogArgs} />,
};

export const editorDialogArgs: DefaultEditorDialogProps = {
  item: 'apiVersion: v1\nkind: Pod',
  open: true,
  onClose: () => undefined,
  setOpen: () => undefined,
  onSave: () => undefined,
  title: 'Edit manifest',
};
export const EditorDialog: Story = {
  render: () => <DefaultEditorDialog {...editorDialogArgs} />,
};

export const contentRendererArgs: DefaultContentRendererProps = {
  content: 'First line\nSecond line',
};
export const ContentRenderer: Story = {
  render: () => <DefaultContentRenderer {...contentRendererArgs} />,
};

export const sectionWrapperArgs: DefaultSectionWrapperProps = {
  title: 'Provider settings',
  children: <Typography>Section content</Typography>,
};
export const SectionWrapper: Story = {
  render: () => <DefaultSectionWrapper {...sectionWrapperArgs} />,
};

export const Dialog: Story = {
  render: () => (
    <DefaultDialog open>
      <DialogTitle>Standalone dialog</DialogTitle>
      <DialogContent>Dialog content</DialogContent>
    </DefaultDialog>
  ),
};
