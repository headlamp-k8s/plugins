/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Alert from '@mui/material/Alert';
import { blue, green, orange, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { escapeRegExp } from 'lodash';
import { fetchMetrics } from '../../../request';
import {
  createTickTimestampFormatter,
  dataProcessor,
  escapePrometheusLabelValue,
  getConfigStore,
} from '../../../util';
import Chart, { type ChartProps } from '../Chart/Chart';
import { formatLatency } from '../KnativeLatencyChart/KnativeLatencyChart';
import { VolcanoChart } from '../VolcanoChart/VolcanoChart';
import {
  type ControlPlane,
  type EventingResource,
  type KnativeEventingTarget,
  type Resolution,
  resolveSubscriptionTarget,
  resolveTriggerTarget,
} from './eventingTarget';

/** The settings the chart switcher passes to each Knative Eventing chart. */
interface EventingChartSettings {
  /** Whether the chart refreshes itself. */
  refresh: boolean;
  /** The Prometheus service or pod to query through the Kubernetes API. */
  prometheusPrefix: string;
  /** The resolution of the chart, such as `medium`. */
  resolution: string;
  /** The sub path of the Prometheus API, if it has one. */
  subPath?: string | null;
  /** The time range shown, such as `1h`. */
  timespan: string;
  /** The tooltip of the chart switcher. */
  CustomTooltip?: (
    props: Parameters<NonNullable<ChartProps['CustomTooltip']>>[0] & {
      /** Formats each value in the tooltip. */
      valueFormatter?: (value: number) => string | number;
    }
  ) => JSX.Element | null;
}

/** A line of a chart. */
interface ChartLine {
  /** The query of the line. */
  query: string;
  /** The name of the line in the legend. */
  name: string;
}

const significantFormat = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 });
const wholeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const succeededStatus = 'http_response_status_code=~"2.."';
const failedStatus = 'http_response_status_code!~"2..",http_response_status_code!=""';

/**
 * Rounds the top of a value axis up, so that each of the axis's four steps is a round number such
 * as 0.01, 25 or 200. A step of 2.5 is skipped, because Recharts draws the ticks 0, 3, 6 and 10
 * for an axis that ends at 10.
 *
 * @param dataMax - The largest value on the chart.
 * @param wholeNumbers - Whether each step must be a whole number of at least 1.
 * @returns The top of the axis.
 */
function getAxisMaximum(dataMax: number, wholeNumbers: boolean) {
  const step = Math.max(dataMax > 0 ? dataMax / 4 : 0, wholeNumbers ? 1 : 0);
  if (step === 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(step));
  const roundStep = [1, 2, 2.5, 5, 10]
    .map(factor => factor * magnitude)
    .find(candidate => candidate >= step && candidate !== 2.5);

  return Number(((roundStep ?? 10 * magnitude) * 4).toPrecision(12));
}

/**
 * Formats a number on a value axis or in the tooltip: below 1000 with at most three significant
 * digits, which leaves out the error of floating point sums such as `0.030000000000000002`, and
 * from 1000 as a whole number, so that a count such as 12,345 keeps every digit.
 *
 * @param value - The number.
 * @returns The formatted number.
 */
function formatNumber(value: number) {
  return Math.abs(value) < 1000 ? significantFormat.format(value) : wholeFormat.format(value);
}

/**
 * Draws lines over time, filled below in a lighter shade of their color, with the time axis the
 * other Prometheus charts use and a value axis in round steps from zero. Stacked lines add up, so
 * that two equal lines do not hide each other. The chart starts again when its request changes:
 * the queries or names of its lines, its timespan or resolution, or the Prometheus it asks. A late
 * answer to the request before, such as on another tab of the chart switcher or for the timespan
 * chosen before, then cannot replace the data of the new one.
 *
 * @param props - The lines, the value axis and the settings of the chart switcher.
 * @returns The chart.
 */
function EventingChart(
  props: EventingChartSettings & {
    /** The lines of the chart, from the bottom up. */
    lines: (ChartLine & {
      /** The color of the line. */
      color: string;
    })[];
    /** The name of the value axis. */
    axisLabel: string;
    /** Formats the numbers on the value axis and in the tooltip. */
    formatValue: (value: number) => string | number;
    /** Whether the value axis steps in whole numbers. */
    wholeNumbers: boolean;
    /** Whether each line is drawn on top of the ones below it, instead of on its own. */
    stacked: boolean;
  }
) {
  const theme = useTheme();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const { CustomTooltip, formatValue, wholeNumbers } = props;

  return (
    <Chart
      key={JSON.stringify([
        props.lines.map(({ query, name }) => [query, name]),
        props.timespan,
        props.resolution,
        props.prometheusPrefix,
        props.subPath ?? '',
      ])}
      plots={props.lines.map(({ query, name, color }) => ({
        query,
        name,
        strokeColor: color,
        fillColor: alpha(color, 0.15),
        dataProcessor,
        stackId: props.stacked ? 'lines' : null,
      }))}
      xAxisProps={{
        dataKey: 'timestamp',
        tickLine: false,
        tick: (tickProps: { x: number; y: number; payload: { value: number } }) => {
          const value = xTickFormatter(tickProps.payload.value);
          if (!value) return null;

          return (
            <g
              transform={`translate(${tickProps.x},${tickProps.y})`}
              fill={theme.palette.chartStyles?.labelColor || theme.palette.text.secondary}
            >
              <text x={0} y={10} dy={0} textAnchor="middle">
                {value}
              </text>
            </g>
          );
        },
      }}
      yAxisProps={{
        domain: [0, (dataMax: number) => getAxisMaximum(dataMax, wholeNumbers)],
        tickCount: 5,
        width: 80,
        allowDecimals: !wholeNumbers,
        tickFormatter: formatValue,
        label: {
          value: props.axisLabel,
          angle: -90,
          position: 'insideLeft',
          style: { textAnchor: 'middle' },
        },
      }}
      CustomTooltip={
        CustomTooltip && (tooltip => CustomTooltip({ ...tooltip, valueFormatter: formatValue }))
      }
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath ?? ''}
    />
  );
}

/**
 * Charts a rate that succeeded in green, such as deliveries, events received or admission
 * requests, with the rate that failed stacked on it in red.
 *
 * @param props - The two lines, the name of the value axis and the settings of the chart switcher.
 * @returns The chart.
 */
export function KnativeEventingStatusChart(
  props: EventingChartSettings & {
    /** The rate that succeeded, such as the deliveries answered with a 2xx status. */
    succeeded: ChartLine;
    /** The rate that failed, such as the deliveries with any other status or no answer. */
    failed: ChartLine;
    /** The name of the value axis. */
    axisLabel: string;
  }
) {
  return (
    <EventingChart
      {...props}
      lines={[
        { ...props.succeeded, color: green[500] },
        { ...props.failed, color: red[500] },
      ]}
      formatValue={formatNumber}
      wholeNumbers={false}
      stacked
    />
  );
}

/**
 * Charts how many times per second a controller reconciled resources of a kind, and how many times
 * it put one back in its queue to reconcile later.
 *
 * @param props - The two queries and the settings of the chart switcher.
 * @returns The chart.
 */
export function KnativeEventingReconcileChart(
  props: EventingChartSettings & {
    /** Query for the reconciles per second. */
    reconciledQuery: string;
    /** Query for the resources put back in the queue per second. */
    requeuedQuery: string;
  }
) {
  const { t } = useTranslation();

  return (
    <EventingChart
      {...props}
      lines={[
        { query: props.reconciledQuery, name: t('Reconciled'), color: blue[500] },
        { query: props.requeuedQuery, name: t('Requeued'), color: orange[500] },
      ]}
      axisLabel={t('Reconciles per second')}
      formatValue={formatNumber}
      wholeNumbers={false}
      stacked={false}
    />
  );
}

/**
 * Charts the 50th, 95th and 99th percentile of the time successful deliveries took.
 *
 * @param props - The three queries, in milliseconds, and the settings of the chart switcher.
 * @returns The chart.
 */
export function KnativeEventingLatencyChart(
  props: EventingChartSettings & {
    /** Query for the median delivery time. */
    p50Query: string;
    /** Query for the 95th percentile of the delivery time. */
    p95Query: string;
    /** Query for the 99th percentile of the delivery time. */
    p99Query: string;
  }
) {
  const { t } = useTranslation();

  return (
    <EventingChart
      {...props}
      lines={[
        { query: props.p99Query, name: t('P99 Latency'), color: red[500] },
        { query: props.p95Query, name: t('P95 Latency'), color: orange[500] },
        { query: props.p50Query, name: t('P50 Latency'), color: blue[500] },
      ]}
      axisLabel={t('Latency')}
      formatValue={formatLatency}
      wholeNumbers
      stacked={false}
    />
  );
}

/**
 * Charts how many events wait for a channel, a Trigger or a source to deliver them.
 *
 * @param props - The query and the settings of the chart switcher.
 * @returns The chart.
 */
export function KnativeEventingQueueChart(
  props: EventingChartSettings & {
    /** Query for the number of events that wait to be delivered. */
    queuedQuery: string;
  }
) {
  const { t } = useTranslation();

  return (
    <EventingChart
      {...props}
      lines={[{ query: props.queuedQuery, name: t('Queued'), color: orange[500] }]}
      axisLabel={t('Events')}
      formatValue={formatNumber}
      wholeNumbers
      stacked={false}
    />
  );
}

/**
 * Builds the chart of succeeded and failed deliveries from a counter labelled with the status each
 * delivery got. The Broker filter and the InMemoryChannel dispatcher label a delivery that got no
 * answer `500`. Series without a status, which the NatsJetStreamChannel dispatcher records under
 * the same channel labels, are left out unless another matcher for failures is given.
 *
 * @param counter - The name of the counter.
 * @param selector - The label matchers of the deliveries to chart.
 * @param t - Translates the chart labels.
 * @param failed - The label matcher of the failed deliveries.
 * @returns The delivery chart.
 */
function getDeliveryChart(
  counter: string,
  selector: string,
  t: (key: string) => string,
  failed = failedStatus
) {
  return {
    key: 'deliveries',
    label: t('Deliveries'),
    icon: 'mdi:send-check',
    queries: {
      succeeded: {
        query: `sum(rate(${counter}{${selector},${succeededStatus}}[5m]))`,
        name: t('Succeeded'),
      },
      failed: { query: `sum(rate(${counter}{${selector},${failed}}[5m]))`, name: t('Failed') },
      axisLabel: t('Deliveries per second'),
    },
    component: KnativeEventingStatusChart,
  };
}

/**
 * Builds the latency chart of successful deliveries from a histogram in seconds.
 *
 * @param buckets - The name of the histogram's bucket series.
 * @param selector - The label matchers of the deliveries to chart.
 * @param t - Translates the chart labels.
 * @returns The latency chart.
 */
function getLatencyChart(buckets: string, selector: string, t: (key: string) => string) {
  const delivered = `rate(${buckets}{${selector},${succeededStatus}}[5m])`;
  const [p50Query, p95Query, p99Query] = ['0.5', '0.95', '0.99'].map(
    quantile => `histogram_quantile(${quantile}, sum by (le) (${delivered})) * 1000`
  );

  return {
    key: 'latency',
    label: t('Delivery latency'),
    icon: 'mdi:timer-outline',
    queries: { p50Query, p95Query, p99Query },
    component: KnativeEventingLatencyChart,
  };
}

/**
 * Builds the delivery and latency charts from `kn_eventing_dispatch_duration_seconds`, which the
 * Broker filter and the InMemoryChannel dispatcher record with the status each delivery got.
 *
 * @param selector - The label matchers of the deliveries to chart.
 * @param t - Translates the chart labels.
 * @returns The delivery and latency charts.
 */
function getDispatchCharts(selector: string, t: (key: string) => string) {
  return [
    getDeliveryChart('kn_eventing_dispatch_duration_seconds_count', selector, t),
    getLatencyChart('kn_eventing_dispatch_duration_seconds_bucket', selector, t),
  ];
}

/**
 * Builds the chart of accepted and rejected events from a counter labelled with the status the
 * resource answered each event with.
 *
 * @param counter - The name of the counter.
 * @param selector - The label matchers of the events to chart.
 * @param t - Translates the chart labels.
 * @returns The chart of received events.
 */
function getReceivedChart(counter: string, selector: string, t: (key: string) => string) {
  return {
    key: 'received',
    label: t('Events received'),
    icon: 'mdi:inbox-arrow-down',
    queries: {
      succeeded: {
        query: `sum(rate(${counter}{${selector},${succeededStatus}}[5m]))`,
        name: t('Accepted'),
      },
      failed: {
        query: `sum(rate(${counter}{${selector},${failedStatus}}[5m]))`,
        name: t('Rejected'),
      },
      axisLabel: t('Events per second'),
    },
    component: KnativeEventingStatusChart,
  };
}

/**
 * Builds the chart of the events that wait to be delivered.
 *
 * @param queuedQuery - The query for the number of waiting events.
 * @param t - Translates the chart labels.
 * @returns The queue chart.
 */
function getQueueChart(queuedQuery: string, t: (key: string) => string) {
  return {
    key: 'queue',
    label: t('Queued events'),
    icon: 'mdi:tray-full',
    queries: { queuedQuery },
    component: KnativeEventingQueueChart,
  };
}

/**
 * Builds the queue chart from Kafka Exporter's lag of some consumer groups. Kafka Exporter gives a
 * partition that a group has not committed an offset for a lag of -1, so that partition counts as
 * 0 instead of taking 1 off the others.
 *
 * @param consumerGroups - The label matchers of the consumer groups to add up.
 * @param t - Translates the chart labels.
 * @returns The queue chart.
 */
function getKafkaQueueChart(consumerGroups: string, t: (key: string) => string) {
  return getQueueChart(`sum(clamp_min(kafka_consumergroup_lag{${consumerGroups}}, 0))`, t);
}

/**
 * Builds the queue chart from Kafka Exporter's lag of one consumer group.
 *
 * @param consumerGroup - The consumer group's name.
 * @param t - Translates the chart labels.
 * @param topics - The topics to count, when the group may also have offsets of other topics.
 * @returns The queue chart.
 */
function getConsumerGroupQueueChart(
  consumerGroup: string,
  t: (key: string) => string,
  topics?: string[]
) {
  const group = `consumergroup="${escapePrometheusLabelValue(consumerGroup)}"`;
  const topicNames =
    topics && escapePrometheusLabelValue(`(${topics.map(escapeRegExp).join('|')})`);

  return getKafkaQueueChart(topicNames ? `${group},topic=~"${topicNames}"` : group, t);
}

/**
 * Builds the queue chart from the NATS exporter's JetStream consumers of some Subscriptions: the
 * events not delivered yet, and the events delivered but not yet answered. Every NATS server that
 * keeps a copy of a replicated consumer reports it, so only the copy of the consumer's leader
 * counts; without a NATS cluster, the exporter names every consumer as led by its server.
 *
 * @param subscriptionUids - The UIDs of the Subscriptions, which name their JetStream consumers.
 * @param t - Translates the chart labels.
 * @returns The queue chart.
 */
function getNatsQueueChart(subscriptionUids: string[], t: (key: string) => string) {
  const consumers = subscriptionUids
    .map(uid => escapeRegExp(`KN_SUB_${uid.replace(/-/g, '').toUpperCase()}`))
    .join('|');
  const consumerNames = escapePrometheusLabelValue(`(${consumers})`);

  return getQueueChart(
    'sum({__name__=~"jetstream_consumer_num_(ack_)?pending",' +
      `consumer_name=~"${consumerNames}",is_consumer_leader="true"})`,
    t
  );
}

/**
 * Builds the query for the admission requests per second for a kind that match some labels, as
 * the busiest webhook that handles the kind recorded them, telling webhooks apart by their scrape
 * job and container. A webhook records a kind only once it has handled a request for it, so the
 * query gives 0 while any webhook is scraped.
 *
 * @param kind - The label matchers of the kind.
 * @param matchers - The label matchers of the webhook and the result.
 * @returns The query.
 */
function getAdmissionRateQuery(kind: string, matchers: string) {
  const requests = 'kn_webhook_handler_duration_seconds_count';

  return (
    `max(sum by (job, container) (rate(${requests}{${kind},${matchers}}[5m]))) ` +
    `or 0 * group(${requests})`
  );
}

/**
 * Builds the chart of the admission requests for a kind. A create or an update passes both the
 * defaulting and the validating webhook, so the allowed requests are counted at validation only.
 * Every webhook that handles the kind records each request, such as both the Eventing and the
 * Kafka webhook for Brokers, so the busiest webhook's rate is taken instead of their sum. Status
 * updates by controllers are left out.
 *
 * @param controlPlane - How the webhooks name the kind.
 * @param t - Translates the chart labels.
 * @returns The admission chart.
 */
function getAdmissionChart(controlPlane: ControlPlane, t: (key: string) => string) {
  const kind =
    `kn_webhook_resource_group="${escapePrometheusLabelValue(controlPlane.group)}",` +
    `kn_webhook_resource_kind="${escapePrometheusLabelValue(controlPlane.kind)}",` +
    'kn_webhook_subresource=""';
  return {
    key: 'admission',
    label: t('Admission requests'),
    icon: 'mdi:shield-check-outline',
    queries: {
      succeeded: {
        query: getAdmissionRateQuery(
          kind,
          'kn_webhook_type="validation",kn_webhook_operation_status="success"'
        ),
        name: t('Allowed'),
      },
      failed: {
        query: getAdmissionRateQuery(
          kind,
          'kn_webhook_type=~"defaulting|validation",kn_webhook_operation_status="failure"'
        ),
        name: t('Rejected'),
      },
      axisLabel: t('Requests per second'),
    },
    component: KnativeEventingStatusChart,
  };
}

/**
 * Builds the chart of the reconciles of a kind, from the work queue of its reconciler.
 *
 * @param reconciler - The `name` of the reconciler's work queue.
 * @param t - Translates the chart labels.
 * @returns The reconcile chart.
 */
function getReconcileChart(reconciler: string, t: (key: string) => string) {
  const queue = `name="${escapePrometheusLabelValue(reconciler)}"`;

  return {
    key: 'reconciles',
    label: t('Reconciles'),
    icon: 'mdi:sync',
    queries: {
      reconciledQuery: `sum(rate(kn_workqueue_process_duration_seconds_count{${queue}}[5m]))`,
      requeuedQuery: `sum(rate(kn_workqueue_retries_total{${queue}}[5m]))`,
    },
    component: KnativeEventingReconcileChart,
  };
}

/**
 * Builds the charts of the events of a Knative Eventing resource.
 *
 * - A channel-based Broker, or a Trigger once its Broker is known to be one: deliveries and latency
 *   from the Broker filter, which names a Trigger `trigger:<name>.<namespace>`. A Trigger is found
 *   by its name alone, because it may use a Broker in another namespace. The filter sends each
 *   event once and the channel behind the Broker retries by sending it to the filter again, so
 *   each sample is one attempt.
 * - A Kafka Broker: the events its receiver accepted and rejected. Its Trigger: the deliveries its
 *   dispatcher recorded, and the events that wait in the Trigger's consumer group.
 * - An InMemoryChannel, or a Subscription to one: the events the channel accepted, and deliveries
 *   and latency from its dispatcher, which names a Subscription
 *   `subscription:<name>.<channel namespace>`. With cross-namespace event links, Subscriptions of
 *   the same name from other namespaces get that name too, so a Subscription's charts also match
 *   its channel. A sample covers the retries, and the dispatcher records the dead letter sink's
 *   answer when the event goes there.
 * - A KafkaChannel: the events its receiver accepted, the deliveries of all its Subscriptions
 *   together, and the events that wait for any of them. Its Subscription: the events that wait for
 *   it, in consumer group `kafka.<channel namespace>.<channel name>.<Subscription UID>`.
 * - A NatsJetStreamChannel: the events its dispatcher accepted; its deliveries carry no status, so
 *   they are not charted. It and a Subscription to it: the events that wait in the JetStream
 *   consumers `KN_SUB_<Subscription UID>`, as their leaders count them.
 * - A KafkaSource: its deliveries, and the events of its topics that wait in its consumer group,
 *   which other sources may share or which may hold offsets of topics it read before.
 * - An ApiServerSource: the events it sent and their latency, from the HTTP requests of the
 *   adapter pods that carry the `eventing.knative.dev/sourceName` label as a metric label.
 *
 * The Kafka data plane records no delivery that got no answer.
 *
 * @param target - The resource, with the channel implementation of a Subscription's Channel known.
 * @param t - Translates the chart labels.
 * @returns The charts, or none for a resource whose events Knative's metrics do not name.
 */
function getDataPlaneCharts(target: KnativeEventingTarget, t: (key: string) => string) {
  const namespace = escapePrometheusLabelValue(target.namespace);
  const name = escapePrometheusLabelValue(target.name);
  const kafkaCount = 'kn_eventing_dispatch_latency_ms_count';

  switch (target.kind) {
    case 'Broker':
      return getDispatchCharts(
        `kn_broker_namespace="${namespace}",kn_broker_name="${name}",` +
          'messaging_destination_name=~"trigger:.*"',
        t
      );
    case 'Trigger':
      return target.broker.brokerClass === 'MTChannelBasedBroker'
        ? getDispatchCharts(`messaging_destination_name="trigger:${name}.${namespace}"`, t)
        : [];
    case 'KafkaBroker':
      return [
        getReceivedChart(
          kafkaCount,
          `kn_broker_namespace="${namespace}",kn_broker_name="${name}"`,
          t
        ),
      ];
    case 'KafkaTrigger':
    case 'KafkaSource': {
      const resource = target.kind === 'KafkaTrigger' ? 'kn_trigger' : 'kn_kafkasource';
      const deliveries = getDeliveryChart(
        kafkaCount,
        `${resource}_namespace="${namespace}",${resource}_name="${name}"`,
        t
      );

      const topics = target.kind === 'KafkaSource' ? target.topics : undefined;

      return target.consumerGroup
        ? [deliveries, getConsumerGroupQueueChart(target.consumerGroup, t, topics)]
        : [deliveries];
    }
    case 'InMemoryChannel': {
      const channel = `kn_channel_namespace="${namespace}",kn_channel_name="${name}"`;

      return [
        getReceivedChart('http_server_request_duration_seconds_count', channel, t),
        ...getDispatchCharts(channel, t),
      ];
    }
    case 'KafkaChannel': {
      const channel = `kn_kafkachannel_namespace="${namespace}",kn_kafkachannel_name="${name}"`;
      const prefix = escapeRegExp(`kafka.${target.namespace}.${target.name}.`);
      const uids = target.subscriptionUids.map(escapeRegExp).join('|');

      return [
        getReceivedChart(kafkaCount, `${channel},messaging_consumer_group_name=""`, t),
        getDeliveryChart(kafkaCount, `${channel},messaging_consumer_group_name!=""`, t),
        getKafkaQueueChart(
          `consumergroup=~"${escapePrometheusLabelValue(`${prefix}(${uids})`)}"`,
          t
        ),
      ];
    }
    case 'NatsJetStreamChannel':
      return [
        getReceivedChart(
          'http_server_request_duration_seconds_count',
          `kn_channel_namespace="${namespace}",kn_channel_name="${name}"`,
          t
        ),
        getNatsQueueChart(target.subscriptionUids, t),
      ];
    case 'Subscription': {
      const channel = target.channel;
      switch (channel.kind) {
        case 'InMemoryChannel': {
          const channelNamespace = escapePrometheusLabelValue(channel.namespace);
          const channelName = escapePrometheusLabelValue(channel.name);

          return getDispatchCharts(
            `kn_channel_namespace="${channelNamespace}",kn_channel_name="${channelName}",` +
              `messaging_destination_name="subscription:${name}.${channelNamespace}"`,
            t
          );
        }
        case 'KafkaChannel':
          return [
            getConsumerGroupQueueChart(
              `kafka.${channel.namespace}.${channel.name}.${target.uid}`,
              t
            ),
          ];
        case 'NatsJetStreamChannel':
          return [getNatsQueueChart([target.uid], t)];
        case 'Channel':
        default:
          return [];
      }
    }
    case 'ApiServerSource': {
      const adapter =
        `namespace="${namespace}",eventing_knative_dev_sourceName="${name}",` +
        'http_request_method="POST",url_template=""';

      return [
        getDeliveryChart(
          'http_client_request_duration_seconds_count',
          adapter,
          t,
          'http_response_status_code!~"2.."'
        ),
        getLatencyChart('http_client_request_duration_seconds_bucket', adapter, t),
      ];
    }
    case 'Resource':
      return [];
  }
}

/**
 * Builds the charts of a Knative Eventing resource: the charts of its events, then the admission
 * requests for its kind and the reconciles of its kind's controller.
 *
 * @param target - The resource, with the channel implementation of a Subscription's Channel known.
 * @param t - Translates the chart labels.
 * @returns The charts.
 */
export function getKnativeEventingChartConfigs(
  target: KnativeEventingTarget,
  t: (key: string) => string
) {
  const { controlPlane } = target;

  return [
    ...getDataPlaneCharts(target, t),
    getAdmissionChart(controlPlane, t),
    ...(controlPlane.reconciler ? [getReconcileChart(controlPlane.reconciler, t)] : []),
  ];
}

const KnativeChannel = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'messaging.knative.dev', version: 'v1' }],
  kind: 'Channel',
  pluralName: 'channels',
  singularName: 'channel',
  isNamespaced: true,
});

const KnativeBroker = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'eventing.knative.dev', version: 'v1' }],
  kind: 'Broker',
  pluralName: 'brokers',
  singularName: 'broker',
  isNamespaced: true,
});

/** A resource that tells which charts another resource has. */
interface Reference {
  /** The class to read the resource with. */
  resourceClass: typeof KnativeChannel;
  /** The resource's kind. */
  kind: 'Broker' | 'Channel';
  /** The resource's namespace. */
  namespace: string;
  /** The resource's name. */
  name: string;
  /** Names the other resource with what reading this one returned. */
  resolve: (read: EventingResource) => Resolution;
}

/**
 * Finds the resource that must be read before a resource's charts are known: the Broker of a
 * Trigger, whose class tells which data plane records the Trigger, or the Channel of a
 * Subscription, which tells its channel implementation.
 *
 * @param target - The resource.
 * @returns The resource to read, or `undefined` when the charts are already known.
 */
function getReference(target: KnativeEventingTarget): Reference | undefined {
  if (target.kind === 'Trigger' && !target.broker.brokerClass) {
    return {
      resourceClass: KnativeBroker,
      kind: 'Broker',
      ...target.broker,
      resolve: broker => resolveTriggerTarget(target, broker),
    };
  }
  if (target.kind === 'Subscription' && target.channel.kind === 'Channel') {
    return {
      resourceClass: KnativeChannel,
      kind: 'Channel',
      namespace: target.channel.namespace,
      name: target.channel.name,
      resolve: channel => resolveSubscriptionTarget(target, channel),
    };
  }
  return undefined;
}

/**
 * Shows the chart switcher with the charts of a resource. The switcher opens on the first chart
 * when it mounts, so it starts again when the first chart changes, such as when a Trigger's Broker
 * is created and the Trigger's deliveries come first. Other changes keep the chart, timespan and
 * resolution chosen in it.
 *
 * @param props - The resource.
 * @returns The charts.
 */
function EventingCharts({
  target,
}: {
  /** The resource, with the channel implementation of a Subscription's Channel known. */
  target: KnativeEventingTarget;
}) {
  const { t } = useTranslation();
  const chartConfigs = getKnativeEventingChartConfigs(target, t);

  return <VolcanoChart key={chartConfigs[0].key} chartConfigs={chartConfigs} />;
}

/**
 * Reads the resource that tells which charts a resource has, and shows them. It lists the resource
 * by its name, so that, once a read has answered, the charts follow when the resource is created or
 * deleted later, and takes the one in the namespace it is named in, because a Headlamp before 0.45
 * lists all namespaces when the allowed namespaces leave that namespace out. While the
 * resource says nothing yet, it shows the charts of the admission requests and reconciles. When the
 * resource cannot be read again, it keeps the charts of what it last read. When the resource cannot
 * be read, is in a namespace that the cluster's allowed namespaces leave out, or does not exist, or
 * there are no delivery charts for what it names, it says so above the charts.
 *
 * @param props - The resource, the resource to read and the cluster.
 * @returns The charts, or nothing while the resource is read.
 */
function ReferencedCharts({
  target,
  reference,
  cluster,
}: {
  /** The resource. */
  target: KnativeEventingTarget;
  /** The resource to read. */
  reference: Reference;
  /** The cluster of the resource. */
  cluster?: string;
}) {
  const { t } = useTranslation();
  const list = reference.resourceClass.useList({
    cluster,
    namespace: reference.namespace,
    fieldSelector: `metadata.name=${reference.name}`,
  });
  const [items, error] = list;

  if (!items && !error) {
    return null;
  }

  const { kind, namespace, name } = reference;
  const read: EventingResource | undefined = items?.find(
    item => item.jsonData?.metadata?.namespace === namespace
  );
  const listed = Object.keys(list.clusterResults ?? {}).length > 0;
  const resolution = read ? reference.resolve(read) : { target };
  let message = resolution.unsupported
    ? t('There are no delivery charts for a {{kind}} whose {{reference}} is {{type}}.', {
        kind: target.controlPlane.kind,
        reference: kind,
        type: resolution.unsupported,
      })
    : undefined;
  if (error) {
    message = t('Could not read {{kind}} {{name}}: {{error}}', {
      kind,
      name,
      error: error.message,
    });
  } else if (!read && !listed) {
    message = t(
      'Could not read {{kind}} {{name}}: namespace {{namespace}} is not in the allowed namespaces.',
      { kind, name, namespace }
    );
  } else if (!read) {
    message = t('Could not find {{kind}} {{name}}.', { kind, name });
  }

  return (
    <>
      {message && (
        <SectionBox>
          <Alert severity={read && !error ? 'info' : 'warning'}>{message}</Alert>
        </SectionBox>
      )}
      <EventingCharts target={resolution.target} />
    </>
  );
}

/**
 * Shows the charts of a resource whose charts depend on another resource while Prometheus metrics
 * are on for the cluster, so that the other resource is read only when the charts can be shown.
 *
 * @param props - The resource, the resource to read and the cluster.
 * @returns The charts, or nothing while metrics are off for the cluster.
 */
function ReferencedChartsWhileMetricsOn(props: {
  /** The resource. */
  target: KnativeEventingTarget;
  /** The resource to read. */
  reference: Reference;
  /** The cluster of the resource. */
  cluster?: string;
}) {
  const metricsCluster = K8s.useCluster();
  const useConfig = getConfigStore().useConfig();
  const config = useConfig();

  if (!metricsCluster || !config?.[metricsCluster]?.isMetricsEnabled) {
    return null;
  }
  return <ReferencedCharts {...props} />;
}

/**
 * Shows the Prometheus charts of a Knative Eventing resource.
 *
 * @param props - The resource and its cluster.
 * @returns The charts, or nothing while metrics are off for the cluster.
 */
export function KnativeEventingChart({
  target,
  cluster,
}: {
  /** The resource, as `getKnativeEventingTarget` names it. */
  target: KnativeEventingTarget;
  /** The cluster of the resource. */
  cluster?: string;
}) {
  const reference = getReference(target);

  if (reference) {
    return (
      <ReferencedChartsWhileMetricsOn target={target} reference={reference} cluster={cluster} />
    );
  }
  return <EventingCharts target={target} />;
}
