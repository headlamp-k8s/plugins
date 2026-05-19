import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, green } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

/**
 * Props for the CapiWorkersChart component.
 */
interface CapiWorkersChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  activeWorkersQuery: string;
  maxWorkersQuery: string;
  timespan: string;
  CapiTooltip: any;
}

/**
 * Chart component for visualizing controller worker metrics.
 * Displays active vs max concurrent reconciles.
 */
export const CapiWorkersChart = (props: CapiWorkersChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.activeWorkersQuery,
      name: t('Active Workers'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.maxWorkersQuery,
      name: t('Max Workers'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: dataProcessor,
    },
  ];

  return (
    <Chart
      plots={plots}
      xAxisProps={getChartXAxisProps(props.timespan, theme)}
      yAxisProps={{ domain: [0, 'auto'], allowDecimals: false }}
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
