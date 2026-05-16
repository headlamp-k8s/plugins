import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { green, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

/**
 * Props for the CapiReconcileChart component.
 */
interface CapiReconcileChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  successQuery: string;
  errorQuery: string;
  timespan: string;
  CapiTooltip: any;
}

/**
 * Chart component for visualizing controller reconciliation rates.
 * Displays success and error/requeue rates per second.
 */
export const CapiReconcileChart = (props: CapiReconcileChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.successQuery,
      name: t('Reconcile Success Rate'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.errorQuery,
      name: t('Reconcile Error Rate'),
      strokeColor: alpha(red[600], 0.8),
      fillColor: alpha(red[400], 0.1),
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
