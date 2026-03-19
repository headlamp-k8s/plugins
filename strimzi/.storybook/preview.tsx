/**
 * Local preview: theme + QueryClient only. MSW is disabled so the service worker
 * does not intercept requests and cause 500 / "Failed to fetch" on the iframe.
 * Add MSW per-story if a story needs API mocks.
 */
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Title, Subtitle, Description, Primary, Controls } from '@storybook/addon-docs/blocks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  darkTheme,
  lightTheme,
} from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: 'always',
      staleTime: 0,
      retry: false,
      gcTime: 0,
    },
  },
});

const withThemeProvider = (Story: any, context: any) => {
  const theme = context.globals.backgrounds?.value === '#1f1f1f' ? darkTheme : lightTheme;
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={createMuiTheme(theme)}>
        <Story {...context} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export const decorators = [withThemeProvider];

export const parameters = {
  backgrounds: {
    values: [
      { name: 'light', value: '#FFF' },
      { name: 'dark', value: '#1f1f1f' },
    ],
  },
  docs: {
    toc: { disable: true },
    page: () => (
      <>
        <Title />
        <Subtitle />
        <Description />
        <Primary />
        <Controls />
      </>
    ),
  },
};

export const tags = ['autodocs'];
