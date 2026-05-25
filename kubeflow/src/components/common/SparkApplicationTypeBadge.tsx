import React from 'react';
import { KubeflowTypeBadge } from './KubeflowTypeBadge';
import { getSparkApplicationType } from './sparkUtils';

export function SparkApplicationTypeBadge(props: { type: string | undefined | null }) {
  const { type } = props;
  const badgeInfo = getSparkApplicationType(type);

  return <KubeflowTypeBadge info={badgeInfo} />;
}
