import type { Meta, StoryObj } from '@storybook/react';
import TestModeInput, { type TestModeInputProps } from './TestModeInput';

const meta = { title: 'AI UI/TestModeInput', component: TestModeInput } satisfies Meta<
  typeof TestModeInput
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const activeTestModeArgs: TestModeInputProps = {
  isTestMode: true,
  onAddTestResponse: () => undefined,
};
export const Active: Story = { args: activeTestModeArgs };
export const Inactive: Story = { args: { ...activeTestModeArgs, isTestMode: false } };
