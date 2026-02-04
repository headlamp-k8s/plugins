import React from 'react';
import { HelmChart } from '../common/Resources';
import { SourceTypePage } from '../SourceTypePage';

export function HelmCharts() {
  return (
    <SourceTypePage
      resourceClass={HelmChart}
      pluralName="helmcharts"
      title="Helm Charts"
    />
  );
}
