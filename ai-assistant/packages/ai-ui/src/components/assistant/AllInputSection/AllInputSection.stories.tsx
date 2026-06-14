import type { Meta, StoryObj } from '@storybook/react';
import { AIInputSection, type AIInputSectionProps } from './AllInputSection';

const meta = { title: 'AI UI/AllInputSection', component: AIInputSection } satisfies Meta<
  typeof AIInputSection
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const openAIConfig = {
  providerId: 'openai-compatible',
  displayName: 'OpenAI Compatible',
  config: { model: 'gpt-4o-mini' },
};
export const localAIConfig = {
  providerId: 'local',
  displayName: 'Local',
  config: { model: 'llama-3.1' },
};

export const baseInputArgs: AIInputSectionProps = {
  promptVal: 'Show unhealthy pods',
  setPromptVal: () => undefined,
  loading: false,
  isTestMode: false,
  activeConfig: openAIConfig,
  availableConfigs: [openAIConfig, localAIConfig],
  selectedModel: 'gpt-4o-mini',
  enabledTools: ['kubernetes_api_request'],
  onSend: () => undefined,
  onStop: () => undefined,
  onClearHistory: () => undefined,
  onConfigChange: () => undefined,
  onTestModeResponse: () => undefined,
  onToggleAgentMode: () => undefined,
  onToolsChange: () => undefined,
};
export const Default: Story = { args: baseInputArgs };
export const Loading: Story = { args: { ...baseInputArgs, loading: true } };
export const AgentMode: Story = { args: { ...baseInputArgs, isAgentMode: true } };
export const TestMode: Story = { args: { ...baseInputArgs, isTestMode: true } };
