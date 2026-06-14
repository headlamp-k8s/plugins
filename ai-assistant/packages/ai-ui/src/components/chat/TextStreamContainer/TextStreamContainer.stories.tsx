import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import type { Meta, StoryObj } from '@storybook/react';
import TextStreamContainer from './TextStreamContainer';

const meta = {
  title: 'Chat/TextStreamContainer',
  component: TextStreamContainer,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <div style={{ height: 400, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextStreamContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const basicHistory: ConversationMessage[] = [
  { role: 'user', content: 'How do I list pods?', requestId: 'user-1' },
  {
    role: 'assistant',
    content:
      'You can list pods using `kubectl get pods`. Add `-A` for all namespaces or `-n <namespace>` for a specific namespace.',
    requestId: 'assistant-1',
  },
];

export const liveThinkingSteps: AgentThinkingStep[] = [
  {
    id: 1,
    label: 'Inspect deployments',
    status: 'running',
    timestamp: 1,
    phase: 'executing',
  },
];

export const Empty: Story = {
  args: { history: [], isLoading: false, apiError: null },
};

export const BasicConversation: Story = {
  args: { history: basicHistory, isLoading: false, apiError: null },
};

export const Loading: Story = {
  args: {
    history: [{ role: 'user', content: 'What pods are failing?', requestId: 'user-loading' }],
    isLoading: true,
    apiError: null,
  },
};

export const WithError: Story = {
  args: {
    history: [],
    isLoading: false,
    apiError: 'Failed to connect to the AI provider. Please check your API key in Settings.',
  },
};

export const ContentFilterError: Story = {
  args: {
    history: [
      { role: 'user', content: 'Write me a poem', requestId: 'user-filter' },
      {
        role: 'assistant',
        content: 'This request was blocked by content filters.',
        contentFilterError: true,
        requestId: 'assistant-filter',
      },
    ],
    isLoading: false,
    apiError: null,
  },
};

export const WithThinkingSteps: Story = {
  args: {
    history: basicHistory,
    isLoading: true,
    apiError: null,
    agentThinkingSteps: liveThinkingSteps,
  },
};
