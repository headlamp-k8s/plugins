import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

/**
 * Mock state matching Headlamp's global Redux store slices.
 * It's important that this is a stable reference to prevent react-redux
 * from triggering infinite re-renders with useSyncExternalStore.
 */
const mockState = {
  filter: { search: '' },
  ui: { theme: 'dark', views: {} },
  config: {
    settings: { tableRowsPerPageOptions: [15, 25, 50] },
  },
};

const mockStore = {
  getState: () => mockState,
  subscribe: () => () => {},
  dispatch: () => {},
  replaceReducer: () => {},
  [Symbol.observable]: function () {
    return this;
  },
};

export function TestProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={mockStore as any}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}
