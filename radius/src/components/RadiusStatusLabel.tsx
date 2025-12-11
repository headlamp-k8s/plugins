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

import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';

/**
 * Radius provisioning states
 */
export type RadiusProvisioningState =
  | 'Succeeded'
  | 'Failed'
  | 'Provisioning'
  | 'Updating'
  | 'Deleting'
  | 'Canceled'
  | 'Accepted'
  | 'Unknown';

export interface RadiusStatusLabelProps {
  readonly status: string | null | undefined;
}

/**
 * Maps Radius provisioning state to Headlamp StatusLabel status
 */
function mapRadiusStateToHeadlampStatus(
  state: string | null | undefined
): 'success' | 'warning' | 'error' | '' {
  const normalizedState = (state || '').trim();

  switch (normalizedState) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
      return 'error';
    case 'Provisioning':
    case 'Updating':
    case 'Accepted':
      return 'warning';
    case 'Deleting':
      return 'warning';
    case 'Canceled':
    case 'Unknown':
    default:
      return '';
  }
}

/**
 * RadiusStatusLabel component extends Headlamp's StatusLabel
 * to display Radius resource provisioning states with appropriate styling
 */
export function RadiusStatusLabel({ status }: Readonly<RadiusStatusLabelProps>) {
  const normalizedStatus = (status || 'Unknown').trim();
  const headlampStatus = mapRadiusStateToHeadlampStatus(status);

  return <StatusLabel status={headlampStatus}>{normalizedStatus}</StatusLabel>;
}

/**
 * Helper function to map Radius provisioning state to status category
 * Used for grouping and filtering
 */
export function getStatusCategory(
  state: string | null | undefined
): 'success' | 'failed' | 'processing' | 'other' {
  const normalizedState = (state || '').trim();

  switch (normalizedState) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
      return 'failed';
    case 'Provisioning':
    case 'Updating':
    case 'Accepted':
      return 'processing';
    case 'Deleting':
    case 'Canceled':
    case 'Unknown':
    default:
      return 'other';
  }
}
