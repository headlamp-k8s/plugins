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

import React, { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { registerKyvernoIcon } from '../kyvernoIcon';

registerKyvernoIcon();

// Use the real Headlamp store which has all 16+ slices pre-configured.
// This avoids manually tracking every slice (filter, config, shortcuts,
// resourceTable, sidebar, ui, …) in a custom stub.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultStore = require('@kinvolk/headlamp-plugin/lib/redux/stores/store').default;

/** Minimal wrapper for all Kyverno Storybook stories. */
export function StoryWrapper({ children }: PropsWithChildren<{}>) {
  return (
    <Provider store={defaultStore}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}
