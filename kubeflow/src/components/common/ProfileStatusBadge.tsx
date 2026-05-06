import React from 'react';
import { KubeflowStatusBadge } from './KubeflowStatusBadge';
import { getProfileStatus } from './notebookUtils';

interface ProfileStatusBadgeProps {
  jsonData: any;
}

export function ProfileStatusBadge({ jsonData }: ProfileStatusBadgeProps) {
  return <KubeflowStatusBadge statusInfo={getProfileStatus(jsonData)} />;
}
