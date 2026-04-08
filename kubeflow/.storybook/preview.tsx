import type { Decorator, Preview } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../src/components/common/TestProvider';

export const decorators: Decorator[] = [
  Story => (
    <TestProvider>
      <Story />
    </TestProvider>
  ),
];

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
