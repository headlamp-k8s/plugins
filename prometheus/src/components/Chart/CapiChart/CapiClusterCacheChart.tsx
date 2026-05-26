import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, green, orange, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

interface CapiClusterCacheChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  connectionUpQuery: string;
  healthcheckQuery: string;
  healthcheckSuccessRateQuery: string;
  healthcheckFailureRateQuery: string;
  clientCacheWaitQuery: string;
  timespan: string;
  CapiTooltip: any;
}

export const CapiClusterCacheChart = (props: CapiClusterCacheChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.connectionUpQuery,
      name: t('Connection Up'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.healthcheckQuery,
      name: t('Healthcheck'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.healthcheckSuccessRateQuery,
      name: t('Successful Healthchecks / s'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.healthcheckFailureRateQuery,
      name: t('Failed Healthchecks / s'),
      strokeColor: alpha(red[600], 0.8),
      fillColor: alpha(red[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.clientCacheWaitQuery,
      name: t('Client Cache Wait (s)'),
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
    />
  );
};
