import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box } from '@mui/material';
import { blue, green, orange, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { getChartXAxisProps } from './CapiChart';

/**
 * Props for the CapiWebhookChart component.
 */
interface CapiWebhookChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  successRateQuery: string;
  errorRateQuery: string;
  p50DurationQuery: string;
  p99DurationQuery: string;
  timespan: string;
  CapiTooltip: any;
}

/**
 * Chart component for visualizing admission webhook performance.
 * Displays success/error rates and processing latencies for admission webhooks.
 */
export const CapiWebhookChart = (props: CapiWebhookChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const ratePlots = [
    {
      query: props.successRateQuery,
      name: t('Success Rate'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.errorRateQuery,
      name: t('Error Rate'),
      strokeColor: alpha(red[600], 0.8),
      fillColor: alpha(red[400], 0.1),
      dataProcessor: dataProcessor,
    },
  ];

  const durationPlots = [
    {
      query: props.p50DurationQuery,
      name: t('p50 Latency (s)'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: dataProcessor,
    },
    {
      query: props.p99DurationQuery,
      name: t('p99 Latency (s)'),
      strokeColor: alpha(orange[600], 0.8),
      fillColor: alpha(orange[400], 0.1),
      dataProcessor: dataProcessor,
    },
  ];

  const xAxisProps = getChartXAxisProps(props.timespan, theme);

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', width: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <Chart
          plots={ratePlots}
          xAxisProps={xAxisProps}
          yAxisProps={{ domain: [0, 'auto'] }}
          CustomTooltip={props.CapiTooltip}
          fetchMetrics={fetchMetrics}
          autoRefresh={props.refresh}
          prometheusPrefix={props.prometheusPrefix}
          interval={props.timespan}
          resolution={props.resolution}
          subPath={props.subPath}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Chart
          plots={durationPlots}
          xAxisProps={xAxisProps}
          yAxisProps={{ domain: [0, 'auto'] }}
          CustomTooltip={props.CapiTooltip}
          fetchMetrics={fetchMetrics}
          autoRefresh={props.refresh}
          prometheusPrefix={props.prometheusPrefix}
          interval={props.timespan}
          resolution={props.resolution}
          subPath={props.subPath}
        />
      </Box>
    </Box>
  );
};
