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

import { addIcon } from '@iconify/react';
import {
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { TextField, Typography } from '@mui/material';
import React from 'react';
import Applications from './applications';
import ApplicationDetailView from './applications/ApplicationDetailView';
import Environments from './environments';
import EnvironmentDetailView from './environments/EnvironmentDetailView';
import Overview from './radius-overview';
import Resources from './resources';
import ResourceDetailView from './resources/ResourceDetailView';

// Plugin configuration defaults
export const PLUGIN_NAME = 'radius-plugin';
export const DEFAULT_UCP_API_VERSION = '2023-10-01-preview';

// SVG logo sourced from assets/logo.svg
addIcon('radius:logo', {
  body: '<path d="m673.37,451.86c0-59.65-23.62-113.75-61.96-153.57l-116.95,126.65c11.91,18.83,10.29,43.99-5.54,61.14-18.9,20.46-50.81,21.74-71.27,2.84-20.46-18.9-21.74-50.81-2.84-71.27,15.55-16.84,39.89-20.65,59.43-10.96l117.13-126.84c-34.52-28.03-77.62-45.84-124.76-48.95.03-.01.05-.02.08-.03-.39-.03-.78-.02-1.17-.04-4.52-.28-9.07-.47-13.66-.47-7.65,0-15.2.39-22.65,1.14-7.45.76-14.78,1.88-21.99,3.36-14.42,2.95-28.33,7.3-41.58,12.91-13.25,5.6-25.84,12.46-37.63,20.42-14.73,9.95-28.2,21.63-40.12,34.74-4.77,5.24-9.29,10.72-13.54,16.41-8.5,11.37-15.94,23.59-22.16,36.5-4.14,8.59-7.69,17.52-10.71,26.68-1.78,5.4-3.37,10.89-4.73,16.47-4.15,16.95-6.4,34.65-6.4,52.89h0c0,19.12,2.42,37.67,6.97,55.36,9.1,35.39,26.74,67.35,50.57,93.58,7.15,7.87,14.86,15.22,23.06,21.99,5.47,4.51,11.16,8.77,17.05,12.75,4.64,3.13,9.44,6.05,14.32,8.83,3.03,1.73,6.1,3.39,9.22,4.97,30.12,15.34,64.19,24.03,100.31,24.03,1.31,0,2.61-.02,3.91-.05,3.31-.07,6.6-.22,9.88-.42.35-.02.7-.01,1.04-.04-.03-.01-.06-.02-.09-.04,115.46-7.59,206.78-103.59,206.78-220.97Z" fill="currentColor"/>',
  width: 903.71,
  height: 903.71,
});

// SVG logo sourced from assets/environment.svg
addIcon('radius:environment', {
  body: '<path d="m940,722.58v-365.16c0-29.93-15.97-57.58-41.88-72.54l-316.24-182.58c-25.92-14.96-57.85-14.96-83.76,0l-316.24,182.58c-25.92,14.96-41.88,42.62-41.88,72.54v365.16c0,29.93,15.97,57.58,41.88,72.54l316.24,182.58c25.92,14.96,57.85,14.96,83.76,0l316.24-182.58c25.92-14.96,41.88-42.62,41.88-72.54Z" fill="currentColor"/><path d="m577.11,576.75c-20.56,20.23-53.63,19.97-73.86-.59-20.23-20.56-19.97-53.63.59-73.86,14.27-14.05,34.57-18.2,52.41-12.57l108.66-106.94c-31.71-25.22-71.32-41.12-114.88-43.2-110.42-5.27-204.21,79.96-209.48,190.38-5.27,110.42,79.96,204.21,190.39,209.48,110.42,5.27,204.21-79.96,209.48-190.38,2.37-49.66-13.61-95.93-41.91-132.32l-108.35,106.64c5.9,18.22,1.54,39.01-13.04,53.35Z" fill="#fff"/>',
  width: 1080,
  height: 1080,
});

// SVG logo sourced from assets/application.svg
addIcon('radius:application', {
  body: '<g><path d="m910.77,167.2H169.23c-35.47,0-64.23,28.76-64.23,64.23v92.56h870v-92.56c0-35.47-28.76-64.23-64.23-64.23Z" fill="currentColor" opacity="0.5"/><path d="m105,324v524.57c0,35.47,28.76,64.23,64.23,64.23h741.55c35.47,0,64.23-28.76,64.23-64.23V324H105Z" fill="currentColor"/><path d="m575.51,647.28c-19.93,19.61-51.98,19.36-71.59-.57-19.61-19.93-19.36-51.98.57-71.59,13.83-13.61,33.5-17.65,50.8-12.18l105.32-103.66c-30.74-24.45-69.13-39.86-111.36-41.87-107.03-5.11-197.94,77.51-203.05,184.54-5.11,107.03,77.51,197.94,184.54,203.05,107.03,5.11,197.94-77.51,203.05-184.54,2.3-48.14-13.19-92.98-40.62-128.26l-105.02,103.37c5.72,17.66,1.49,37.81-12.64,51.71Z" fill="#fff"/></g><path d="m712.3,271.75c-11.17,0-20.23-9.06-20.23-20.23s9.06-20.23,20.23-20.23,20.23,9.06,20.23,20.23-9.06,20.23-20.23,20.23Z" fill="currentColor"/><path d="m803.02,271.75c-11.17,0-20.23-9.06-20.23-20.23s9.06-20.23,20.23-20.23,20.23,9.06,20.23,20.23-9.06,20.23-20.23,20.23Z" fill="currentColor"/><path d="m893.74,271.75c-11.17,0-20.23-9.06-20.23-20.23s9.06-20.23,20.23-20.23,20.23,9.06,20.23,20.23-9.06,20.23-20.23,20.23Z" fill="currentColor"/>',
  width: 1080,
  height: 1080,
});

// Define sidebar entries configuration
interface SidebarEntry {
  parent: string | null;
  name: string;
  label: string;
  url: string;
  icon?: string;
}

const sidebarEntries: SidebarEntry[] = [
  {
    parent: null,
    name: 'radius',
    label: 'Radius',
    url: '/radius-overview',
    icon: 'radius:logo',
  },
  {
    parent: 'radius',
    name: 'radius-overview',
    label: 'Overview',
    url: '/radius-overview',
    icon: 'mdi:view-dashboard',
  },
  {
    parent: 'radius',
    name: 'environments',
    label: 'Environments',
    url: '/environments',
    icon: 'radius:environment',
  },
  {
    parent: 'radius',
    name: 'applications',
    label: 'Applications',
    url: '/applications',
    icon: 'radius:application',
  },
  {
    parent: 'radius',
    name: 'resources',
    label: 'Resources',
    url: '/resources',
    icon: 'mdi:cube-outline',
  },
];

// Register sidebar entries using the map
for (const entry of sidebarEntries) {
  registerSidebarEntry({
    parent: entry.parent,
    name: entry.name,
    label: entry.label,
    url: entry.url,
    icon: entry.icon,
  });
}

// Register routes for each sidebar entry
for (const entry of sidebarEntries) {
  registerRoute({
    path: entry.url,
    sidebar: entry.name,
    name: entry.name,
    exact: true,
    component: () => {
      // Use the Overview component for the overview route
      if (entry.name === 'radius-overview' || entry.name === 'radius') {
        return <Overview />;
      }

      // Use the Environments component for the environments route
      if (entry.name === 'environments') {
        return <Environments />;
      }

      // Use the Applications component for the applications route
      if (entry.name === 'applications') {
        return <Applications />;
      }

      // Use the Resources component for the resources route
      if (entry.name === 'resources') {
        return <Resources />;
      }

      // Placeholder for other routes
      return (
        <SectionBox title={entry.label} textAlign="center" paddingTop={2}>
          <Typography>{entry.label} content goes here</Typography>
        </SectionBox>
      );
    },
  });
}

/**
 * Plugin Settings Component
 * Allows users to configure the UCP API version
 */
interface RadiusPluginSettings {
  ucpApiVersion?: string;
}

function RadiusPluginSettingsComponent(
  props: Readonly<{
    data?: RadiusPluginSettings;
    onDataChange?: (data: RadiusPluginSettings) => void;
  }>
) {
  const { data, onDataChange } = props;

  function handleApiVersionChange(value: string) {
    if (onDataChange) {
      onDataChange({ ucpApiVersion: value });
    }
  }

  return (
    <TextField
      value={data?.ucpApiVersion || DEFAULT_UCP_API_VERSION}
      onChange={e => handleApiVersionChange(e.target.value)}
      label="UCP API Version"
      helperText="The Radius UCP API version to use (e.g., 2023-10-01-preview)"
      variant="outlined"
      fullWidth
    />
  );
}

// Register plugin settings
registerPluginSettings(PLUGIN_NAME, RadiusPluginSettingsComponent, true);

// Register environment detail route
registerRoute({
  path: '/environments/:environmentName',
  sidebar: 'environments',
  name: 'environment-detail',
  exact: true,
  component: () => <EnvironmentDetailView />,
});

// Register application detail route
registerRoute({
  path: '/applications/:applicationName',
  sidebar: 'applications',
  name: 'application-detail',
  exact: true,
  component: () => <ApplicationDetailView />,
});

// Register resource detail route
registerRoute({
  path: '/resources/:resourceName',
  sidebar: 'resources',
  name: 'resource-detail',
  exact: true,
  component: () => <ResourceDetailView />,
});
