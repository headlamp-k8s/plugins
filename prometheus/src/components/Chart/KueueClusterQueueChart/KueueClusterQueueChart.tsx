import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, green, orange, purple, red, teal } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';

const PLOT_COLORS = [blue, orange, green, purple, red, teal];

/** One line on a Kueue ClusterQueue chart, backed by a single PromQL query. */
export interface KueueClusterQueuePlot {
  query: string;
  name: string;
}

interface KueueClusterQueueMetricChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath?: string;
  timespan: string;
  plots: KueueClusterQueuePlot[];
  yAxisLabel: string;
  CustomTooltip: (props: any) => JSX.Element | null;
}

/** Renders one Kueue ClusterQueue metric view, one unstacked line per plot. */
export function KueueClusterQueueMetricChart(props: KueueClusterQueueMetricChartProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);

  // Literal keys so i18n extraction finds them; flavor and resource names pass through.
  const translateLabel = (label: string) => {
    switch (label) {
      case 'Pending (active)':
        return t('Pending (active)');
      case 'Pending (inadmissible)':
        return t('Pending (inadmissible)');
      case 'Admitted':
        return t('Admitted');
      case 'p50 wait':
        return t('p50 wait');
      case 'p95 wait':
        return t('p95 wait');
      case 'Workloads':
        return t('Workloads');
      case '% of nominal quota':
        return t('% of nominal quota');
      case 'Seconds':
        return t('Seconds');
      default:
        return label;
    }
  };

  return (
    <Chart
      plots={props.plots.map((plot, index) => {
        const color = PLOT_COLORS[index % PLOT_COLORS.length];
        return {
          query: plot.query,
          name: translateLabel(plot.name),
          strokeColor: alpha(color[600], 0.8),
          fillColor: alpha(color[400], 0.1),
          stackId: null,
          dataProcessor: dataProcessor,
        };
      })}
      xAxisProps={{
        dataKey: 'timestamp',
        tickLine: false,
        tick: tickProps => {
          const value = xTickFormatter(tickProps.payload.value);
          if (!value) return null;

          return (
            <g
              transform={`translate(${tickProps.x},${tickProps.y})`}
              fill={theme.palette.chartStyles.labelColor}
            >
              <text x={0} y={10} dy={0} textAnchor="middle">
                {value}
              </text>
            </g>
          );
        },
      }}
      yAxisProps={{
        domain: [0, 'auto'],
        width: 80,
        label: {
          value: translateLabel(props.yAxisLabel),
          angle: -90,
          position: 'insideLeft',
          style: { textAnchor: 'middle' },
        },
      }}
      CustomTooltip={props.CustomTooltip}
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath}
    />
  );
}

function escapePrometheusLabelValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/** The parts of a ClusterQueue spec that decide which quota lines to draw. */
export interface KueueClusterQueueResourceGroup {
  flavors?: Array<{ name: string; resources?: Array<{ name: string }> }>;
}

/**
 * Builds the metric views for a Kueue ClusterQueue.
 *
 * Series from follower replicas are skipped so an HA Kueue install is not
 * counted twice. Older Kueue releases have no `replica_role` label, and
 * `!=` still matches those series.
 *
 * Quota usage is drawn as a percentage of nominal quota so CPU, memory and
 * GPUs share one axis. There is one line per flavor and resource in the spec,
 * because the shared Chart reads a single series per query.
 *
 * @param name - Name of the ClusterQueue being viewed.
 * @param resourceGroups - `spec.resourceGroups` of the ClusterQueue.
 */
export function getKueueClusterQueueChartConfigs(
  name: string,
  resourceGroups: KueueClusterQueueResourceGroup[] = []
) {
  const selector = `cluster_queue="${escapePrometheusLabelValue(name)}",replica_role!="follower"`;

  const quotaPlots = resourceGroups.flatMap(group =>
    (group.flavors ?? []).flatMap(flavor =>
      (flavor.resources ?? []).map(resource => {
        const quotaSelector = `${selector},flavor="${escapePrometheusLabelValue(
          flavor.name
        )}",resource="${escapePrometheusLabelValue(resource.name)}"`;
        return {
          // Drop points where the nominal quota is 0 instead of plotting Inf.
          query: `100 * sum(kueue_cluster_queue_resource_usage{${quotaSelector}}) / (sum(kueue_cluster_queue_nominal_quota{${quotaSelector}}) > 0)`,
          name: `${flavor.name} ${resource.name}`,
        };
      })
    )
  );

  const waitTimeQuantile = (quantile: number) =>
    `histogram_quantile(${quantile}, sum by (le) (rate(kueue_admission_wait_time_seconds_bucket{${selector}}[5m])))`;

  return [
    {
      key: 'workloads',
      label: 'Workloads',
      icon: 'mdi:tray-full',
      queries: {
        plots: [
          {
            query: `sum(kueue_pending_workloads{${selector},status="active"})`,
            name: 'Pending (active)',
          },
          {
            query: `sum(kueue_pending_workloads{${selector},status="inadmissible"})`,
            name: 'Pending (inadmissible)',
          },
          {
            query: `sum(kueue_admitted_active_workloads{${selector}})`,
            name: 'Admitted',
          },
        ],
        yAxisLabel: 'Workloads',
      },
      component: KueueClusterQueueMetricChart,
    },
    {
      key: 'quota-usage',
      label: 'Quota usage',
      icon: 'mdi:gauge',
      queries: {
        plots: quotaPlots,
        yAxisLabel: '% of nominal quota',
      },
      component: KueueClusterQueueMetricChart,
    },
    {
      key: 'admission-wait',
      label: 'Admission wait',
      icon: 'mdi:timer-sand',
      queries: {
        plots: [
          { query: waitTimeQuantile(0.5), name: 'p50 wait' },
          { query: waitTimeQuantile(0.95), name: 'p95 wait' },
        ],
        yAxisLabel: 'Seconds',
      },
      component: KueueClusterQueueMetricChart,
    },
  ].filter(config => config.queries.plots.length > 0);
}
