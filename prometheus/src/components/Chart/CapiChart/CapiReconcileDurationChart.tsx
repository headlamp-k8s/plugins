import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, orange } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

/**
 * Props for the CapiReconcileDurationChart component.
 */
interface CapiReconcileDurationChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  p50Query: string;
  p99Query: string;
  timespan: string;
  CapiTooltip: any;
}

/**
 * Chart component for visualizing controller reconciliation latencies.
 * Displays p50 and p99 duration quantiles in seconds.
 */
export const CapiReconcileDurationChart = (props: CapiReconcileDurationChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.p50Query,
      name: t('p50 Duration (s)'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.p99Query,
      name: t('p99 Duration (s)'),
      strokeColor: alpha(orange[600], 0.8),
      fillColor: alpha(orange[400], 0.1),
      dataProcessor: dataProcessor,
    },
  ];

  return (
    <Chart
      plots={plots}
      xAxisProps={getChartXAxisProps(props.timespan, theme)}
      yAxisProps={{ domain: [0, 'auto'] }}
      CustomTooltip={props.CapiTooltip}
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath}
      stacked={false}
    />
  );
};
