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

import { Icon } from '@iconify/react';
import React from 'react';

export const ARGO_ICON_NAME = 'simple-icons:argo';
export const ARGO_ICON_COLOR = '#EF7B4D';

/** Offline Argo CD Iconify icon used by sidebar, Map, and kind registrations. */
export const argoIcon = React.createElement(Icon, {
  icon: ARGO_ICON_NAME,
  color: ARGO_ICON_COLOR,
  width: '100%',
  height: '100%',
});
