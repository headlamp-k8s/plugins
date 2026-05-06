import React from 'react';
import { KubeflowStatusBadge } from './KubeflowStatusBadge';
import { getNotebookStatus } from './notebookUtils';

interface NotebookStatusBadgeProps {
  jsonData: any;
}

export function NotebookStatusBadge({ jsonData }: NotebookStatusBadgeProps) {
  return <KubeflowStatusBadge statusInfo={getNotebookStatus(jsonData)} />;
}
