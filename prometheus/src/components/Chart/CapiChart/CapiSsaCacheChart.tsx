import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, orange } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

interface CapiSsaCacheChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  hitsRateQuery: string;
  missesRateQuery: string;
  timespan: string;
  CapiTooltip: any;
}

/** Server-Side Apply cache hit/miss rates for a CAPI controller. */
export const CapiSsaCacheChart = (props: CapiSsaCacheChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const plots = [
    {
      query: props.hitsRateQuery,
      name: t('Cache Hits / s'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.missesRateQuery,
      name: t('Cache Misses / s'),
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
