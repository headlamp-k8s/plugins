import React from 'react';
import type {
  ScheduledSparkApplication,
  ScheduledSparkApplicationClass,
} from '../../resources/sparkApplication';
import { KubeflowStatusBadge } from './KubeflowStatusBadge';
import { getScheduledSparkApplicationStatus } from './sparkUtils';

export function ScheduledSparkApplicationStatusBadge(props: {
  scheduledSparkApplication:
    | ScheduledSparkApplication
    | ScheduledSparkApplicationClass
    | null
    | undefined;
}) {
  const { scheduledSparkApplication } = props;
  const status = getScheduledSparkApplicationStatus(scheduledSparkApplication);

  return <KubeflowStatusBadge info={status} />;
}
