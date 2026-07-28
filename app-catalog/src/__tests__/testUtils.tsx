import { render, RenderOptions } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with common providers
 * (Router, SnackbarProvider, etc.)
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    ...renderOptions
  }: RenderOptions & { route?: string } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <SnackbarProvider maxSnack={3}>
          {children}
        </SnackbarProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility to wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await delay(interval);
  }
}

// Re-export everything from testing library
export * from '@testing-library/react';
