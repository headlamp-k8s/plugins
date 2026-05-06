import React from 'react';
import { KubeflowTypeBadge } from './KubeflowTypeBadge';
import { getNotebookType } from './notebookUtils';

interface NotebookTypeBadgeProps {
  image: string;
}

export function NotebookTypeBadge({ image }: NotebookTypeBadgeProps) {
  return <KubeflowTypeBadge typeInfo={getNotebookType(image)} />;
}
