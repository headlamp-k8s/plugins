/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { configureStore } from '@reduxjs/toolkit';
import type { StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';

/**
 * Minimal Redux store to satisfy Headlamp components that depend on
 * `useSettings` / `useTypedSelector` (e.g. SimpleTable, NameValueTable).
 */
const initialConfigState = {
  settings: {
    tableRowsPerPageOptions: [15, 25, 50],
  },
};
const initialFilterState = { search: '' };
const initialPluginsState = { pluginSettings: {} };
const initialUiState = { details: { isVisible: false } };

const minimalStore = configureStore({
  reducer: {
    // Return existing state by default to prevent infinite re-renders
    config: (state = initialConfigState) => state,
    filter: (state = initialFilterState) => state,
    plugins: (state = initialPluginsState) => state,
    ui: (state = initialUiState) => state,
  },
});

/**
 * Storybook decorator that wraps stories in a Redux Provider.
 *
 * Usage in story files:
 * ```
 * import { ReduxDecorator } from '../../helpers/storybook';
 *
 * export default {
 *   decorators: [ReduxDecorator],
 * } as Meta;
 * ```
 */
export const ReduxDecorator = (Story: StoryFn) => (
  <Provider store={minimalStore}>
    <Story />
  </Provider>
);
