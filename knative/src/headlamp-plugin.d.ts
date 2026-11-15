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

/// <reference types="@kinvolk/headlamp-plugin" />

import type { SxProps, Theme } from '@mui/material/styles';

// Headlamp 0.44 exposes these public sidebar fields. The currently published
// plugin SDK types predate them, so augment the SDK until its declarations catch up.
declare module '@kinvolk/headlamp-plugin/lib/components/Sidebar/sidebarSlice' {
  interface SidebarEntry {
    entryType?: 'link' | 'subheader';
    sx?: SxProps<Theme>;
  }
}
