import React from 'react';
import type { SparkApplication, SparkApplicationClass } from '../../resources/sparkApplication';
import { KubeflowStatusBadge } from './KubeflowStatusBadge';
import { getSparkApplicationStatus } from './sparkUtils';

export function SparkApplicationStatusBadge(props: {
  sparkApplication: SparkApplication | SparkApplicationClass | null | undefined;
}) {
  const { sparkApplication } = props;
  const status = getSparkApplicationStatus(sparkApplication);

  return <KubeflowStatusBadge info={status} />;
}
