/**
 * Local preview: theme, QueryClient, and Redux (headlamp SimpleTable uses useSettings → config slice).
 * MSW is disabled; add per-story if needed.
 */
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { Title, Subtitle, Description, Primary, Controls } from '@storybook/addon-docs/blocks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import {
  darkTheme,
  lightTheme,
} from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import configReducer from '@kinvolk/headlamp-plugin/lib/redux/configSlice';

const storybookStore = configureStore({
  reducer: {
    config: configReducer,
  },
});

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
    <ReduxProvider store={storybookStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={createMuiTheme(theme)}>
          <Story {...context} />
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
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
