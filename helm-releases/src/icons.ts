/*
 * Copyright 2026 The Kubernetes Authors
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

import { addIcon } from '@iconify/react';

/**
 * Iconify fetches the data of the icons it does not know from its public API at runtime, which
 * air-gapped installations cannot reach. The icons this plugin uses are bundled below, so that
 * they render without any network call, including the one named by the sidebar entry.
 *
 * See https://docs.iconify.design/icon-components/bundles/react.html
 *
 * Regenerate with:
 *   curl 'https://api.iconify.design/mdi.json?icons=<comma-separated-names-without-prefix>'
 * Icon set: mdi, lastModified 1737398331, viewBox 0 0 24 24.
 */
const ICON_SIZE = 24;

const MDI_ICON_BODIES: Record<string, string> = {
  check: '<path fill="currentColor" d="M21 7L9 19l-5.5-5.5l1.41-1.41L9 16.17L19.59 5.59z"/>',
  'chevron-down': '<path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z"/>',
  'content-copy':
    '<path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/>',
  refresh:
    '<path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 0 0-8 8a8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6a6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"/>',
  'ship-wheel':
    '<path fill="currentColor" d="m2 11l2.05.1a7.96 7.96 0 0 1 3.2-5.54L6.13 3.84c-.27-.48-.13-1.09.37-1.37c.5-.27 1.09-.11 1.37.37l.93 1.82a8.1 8.1 0 0 1 6.4 0l.93-1.82c.28-.48.87-.64 1.37-.37c.5.28.64.89.37 1.37l-1.12 1.72a7.96 7.96 0 0 1 3.2 5.54L22 11a1 1 0 0 1 1 1a1 1 0 0 1-1 1l-2.05-.1a7.96 7.96 0 0 1-3.2 5.54l1.12 1.72c.27.48.13 1.09-.37 1.37c-.5.27-1.09.11-1.37-.37l-.93-1.82a8.1 8.1 0 0 1-6.4 0l-.93 1.82c-.28.48-.87.64-1.37.37c-.5-.28-.64-.89-.37-1.37l1.12-1.72a7.96 7.96 0 0 1-3.2-5.54L2 13a1 1 0 0 1-1-1a1 1 0 0 1 1-1m7.07.35c.13-.61.46-1.15.93-1.56L8.34 7.25a6 6 0 0 0-2.29 3.95zM12 9c.32 0 .62.05.9.14l1.38-2.69C13.58 6.16 12.81 6 12 6s-1.58.16-2.28.45l1.38 2.69c.28-.09.58-.14.9-.14m2.93 2.35l3.02-.15a6 6 0 0 0-2.29-3.95L14 9.79c.47.41.8.95.93 1.56m0 1.3c-.13.61-.46 1.15-.93 1.56l1.66 2.54a6 6 0 0 0 2.29-3.95zM12 15c-.32 0-.62-.05-.91-.14l-1.37 2.69c.7.29 1.47.45 2.28.45s1.58-.16 2.28-.45l-1.37-2.69c-.29.09-.59.14-.91.14m-2.93-2.35l-3.02.15c.22 1.6 1.06 3.01 2.29 3.95L10 14.21c-.47-.41-.8-.95-.93-1.56"/>',
};

/** Registers the icons used by this plugin, so they render without any call to the Iconify API. */
export function registerEmbeddedIcons() {
  for (const [name, body] of Object.entries(MDI_ICON_BODIES)) {
    addIcon(`mdi:${name}`, { body, width: ICON_SIZE, height: ICON_SIZE });
  }
}
