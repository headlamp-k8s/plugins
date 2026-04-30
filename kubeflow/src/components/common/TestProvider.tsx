import './StorybookMocks';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

/**
 * Mock state matching Headlamp's global Redux store slices.
 * It's important that this is a stable reference to prevent react-redux
 * from triggering infinite re-renders with useSyncExternalStore.
 */
const mockState = {
  filter: { search: '', namespaces: new Set(['default']) },
  ui: { theme: 'dark', views: {}, sidebar: { isFull: true } },
  clusterAction: {},
  config: { settings: { tableRowsPerPageOptions: [15, 25, 50] } },
  plugins: {},
  actionButtons: {},
  notifications: {},
  theme: {},
  resourceTable: {
    tableColumnsProcessors: [],
  },
  detailsViewSection: {
    detailViews: [],
    detailsViewSections: [],
    detailsViewSectionsProcessors: [],
  },
  routes: {},
  sidebar: {},
  detailsViewSections: {
    detailViews: [],
    detailsViewSections: [],
    detailsViewSectionsProcessors: [],
  },
  eventCallbackReducer: {},
  pluginConfigs: {},
  overviewCharts: {},
  drawerMode: {},
  graphView: {},
  clusterProvider: {},
  activity: {},
  projects: {},
  shortcuts: {
    shortcuts: {
      GLOBAL_SEARCH: { key: '/' },
      CLUSTER_CHOOSER: { key: 'ctrl+shift+l' },
      TABLE_COLUMN_FILTERS: { key: 'alt+shift+t' },
      LOG_VIEWER_SEARCH: { key: 'ctrl+shift+f' },
    },
    isShortcutsDialogOpen: false,
  },
  namespaces: {
    namespaces: ['default', 'kubeflow'],
    selected: ['default'],
  },
  cluster: {
    cluster: 'main',
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
  // Ensure the Storybook mock flag is set for hooks to detect
  if (typeof window !== 'undefined') {
    (window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK = true;
  }

  return (
    <Provider store={mockStore as any}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}
