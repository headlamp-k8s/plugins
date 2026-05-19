import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { orange, purple, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

/**
 * Props for the CapiQueueChart component.
 */
interface CapiQueueChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  depthQuery: string;
  addsRateQuery: string;
  retriesRateQuery: string;
  timespan: string;
  CapiTooltip: any;
}

/**
 * Chart component for visualizing controller workqueue metrics.
 * Displays queue depth, item addition rates, and retry rates.
 */
export const CapiQueueChart = (props: CapiQueueChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.depthQuery,
      name: t('Queue Depth'),
      strokeColor: alpha(orange[600], 0.8),
      fillColor: alpha(orange[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.addsRateQuery,
      name: t('Adds / s'),
      strokeColor: alpha(purple[600], 0.8),
      fillColor: alpha(purple[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.retriesRateQuery,
      name: t('Retries / s'),
      strokeColor: alpha(red[600], 0.8),
      fillColor: alpha(red[400], 0.1),
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
