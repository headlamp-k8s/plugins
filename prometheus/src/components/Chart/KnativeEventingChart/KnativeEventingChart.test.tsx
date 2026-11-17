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

import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import { render, screen } from '@testing-library/react';
import { type ReactNode, StrictMode } from 'react';
import type { ChartProps } from '../Chart/Chart';
import { formatLatency } from '../KnativeLatencyChart/KnativeLatencyChart';
import type { VolcanoChart } from '../VolcanoChart/VolcanoChart';
import type {
  ControlPlane,
  EventingResource,
  KnativeEventingTarget,
  SubscriptionTarget,
  TriggerTarget,
} from './eventingTarget';
import {
  getKnativeEventingChartConfigs,
  KnativeEventingChart,
  KnativeEventingLatencyChart,
  KnativeEventingQueueChart,
  KnativeEventingReconcileChart,
  KnativeEventingStatusChart,
} from './KnativeEventingChart';

const recorded = vi.hoisted(
  (): {
    /** The props a chart last gave the shared chart. */
    chart?: ChartProps;
    /** The props the resource's charts last gave the chart switcher. */
    switcher?: Parameters<typeof VolcanoChart>[0];
    /** The Brokers or Channels that listing one by name returns, or nothing while it loads. */
    readItems?: EventingResource[];
    /** The error that reading a Broker or Channel returns. */
    readError?: ApiError;
    /** Whether listing sends no request, because the allowed namespaces leave the namespace out. */
    readSkipped?: boolean;
    /** The kind of the resource last listed, and the options it was listed with. */
    readRequest?: unknown[];
    /** The cluster whose Prometheus settings apply. */
    metricsCluster?: string;
    /** The Prometheus settings of each cluster. */
    clusterConfig?: Record<string, { isMetricsEnabled?: boolean }>;
    /** What the chart switcher's tooltip was last given. */
    tooltip?: unknown;
    /** How many times the chart switcher was mounted. */
    switcherMounts: number;
    /** How many times the shared chart was mounted. */
    chartMounts: number;
  } => ({ switcherMounts: 0, chartMounts: 0 })
);

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const { useCallback, useState } = await vi.importActual<typeof import('react')>('react');
  const original = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();

  return {
    ...original,
    K8s: {
      ...original.K8s,
      useCluster: () => useState(() => recorded.metricsCluster ?? null)[0],
      crd: {
        ...original.K8s.crd,
        makeCustomResourceClass: ({ kind }: { kind: string }) => ({
          useList: (options: { cluster?: string }) => {
            recorded.readRequest = [kind, options];
            const [items] = useState(() => recorded.readItems ?? null);
            const [error] = useState(() => recorded.readError ?? null);
            const [skipped] = useState(() => recorded.readSkipped ?? false);
            const listed = options.cluster ?? recorded.metricsCluster;
            const clusterResults = items && !skipped && listed ? { [listed]: { items } } : {};

            return Object.assign([items, error], { clusterResults });
          },
        }),
      },
    },
    useTranslation: () => ({
      t: useCallback(
        (key: string, values?: Record<string, string>) =>
          values ? `t(${key}, ${JSON.stringify(values)})` : `t(${key})`,
        []
      ),
    }),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock('../../../util', async importOriginal => {
  const { useState } = await vi.importActual<typeof import('react')>('react');

  return {
    ...(await importOriginal<typeof import('../../../util')>()),
    getConfigStore: () => ({
      useConfig: () => () => useState(() => recorded.clusterConfig)[0],
    }),
  };
});

vi.mock('../Chart/Chart', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react');

  return {
    default: (props: ChartProps) => {
      recorded.chart = props;
      useEffect(() => {
        recorded.chartMounts += 1;
      }, []);
      return null;
    },
  };
});

vi.mock('../VolcanoChart/VolcanoChart', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react');

  return {
    VolcanoChart: (props: Parameters<typeof VolcanoChart>[0]) => {
      recorded.switcher = props;
      useEffect(() => {
        recorded.switcherMounts += 1;
      }, []);
      return null;
    },
  };
});

/** An error that Headlamp's API returns when the user may not read a resource. */
class ForbiddenError extends Error implements ApiError {
  /** The name of the error. */
  name = 'ForbiddenError';
  /** The HTTP status of the error. */
  status = 403;
}

/**
 * Stands in for the translation function, returning each label unchanged.
 *
 * @param key - The label.
 * @returns The same label.
 */
function translate(key: string) {
  return key;
}

const succeeded = 'http_response_status_code=~"2.."';
const failed = 'http_response_status_code!~"2..",http_response_status_code!=""';
const dispatchCount = 'kn_eventing_dispatch_duration_seconds_count';
const dispatchBuckets = 'kn_eventing_dispatch_duration_seconds_bucket';
const kafkaCount = 'kn_eventing_dispatch_latency_ms_count';
const subscriptionToO =
  'kn_channel_namespace="billing",kn_channel_name="o",' +
  'messaging_destination_name="subscription:to-billing.billing"';
const settings = {
  refresh: true,
  prometheusPrefix: 'monitoring/pods/prometheus-0:9090',
  resolution: 'medium',
  subPath: null,
  timespan: '1h',
};
const brokerPlane: ControlPlane = {
  group: 'eventing.knative.dev',
  kind: 'Broker',
  reconciler: 'knative.dev.eventing.pkg.reconciler.broker.Reconciler',
};
const subscriptionPlane: ControlPlane = {
  group: 'messaging.knative.dev',
  kind: 'Subscription',
  reconciler: 'knative.dev.eventing.pkg.reconciler.subscription.Reconciler',
};

/**
 * Builds Subscription `to-billing` in namespace `shop`.
 *
 * @param channel - The channel the Subscription receives events from.
 * @returns The Subscription.
 */
function subscriptionTo(channel: SubscriptionTarget['channel']): KnativeEventingTarget {
  return {
    kind: 'Subscription',
    namespace: 'shop',
    name: 'to-billing',
    uid: 'c3',
    controlPlane: subscriptionPlane,
    channel,
  };
}

/**
 * Builds Trigger `catch-all` in namespace `shop`, of Broker `default`.
 *
 * @param brokerClass - The Broker's class, once the Broker is read.
 * @returns The Trigger.
 */
function triggerOf(brokerClass?: 'MTChannelBasedBroker'): TriggerTarget {
  return {
    kind: 'Trigger',
    namespace: 'shop',
    name: 'catch-all',
    controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
    broker: { namespace: 'shop', name: 'default', brokerClass },
  };
}

/**
 * Gives the lines and value axis of a chart of succeeded and failed deliveries.
 *
 * @param counter - The counter of the deliveries.
 * @param selector - The label matchers of the deliveries.
 * @param failedStatus - The label matcher of the failed deliveries.
 * @returns The lines and the name of the value axis.
 */
function deliveryQueries(counter: string, selector: string, failedStatus = failed) {
  return {
    succeeded: { query: `sum(rate(${counter}{${selector},${succeeded}}[5m]))`, name: 'Succeeded' },
    failed: { query: `sum(rate(${counter}{${selector},${failedStatus}}[5m]))`, name: 'Failed' },
    axisLabel: 'Deliveries per second',
  };
}

/**
 * Gives the lines and value axis of a chart of accepted and rejected events.
 *
 * @param counter - The counter of the events.
 * @param selector - The label matchers of the events.
 * @returns The lines and the name of the value axis.
 */
function receivedQueries(counter: string, selector: string) {
  return {
    succeeded: { query: `sum(rate(${counter}{${selector},${succeeded}}[5m]))`, name: 'Accepted' },
    failed: { query: `sum(rate(${counter}{${selector},${failed}}[5m]))`, name: 'Rejected' },
    axisLabel: 'Events per second',
  };
}

/**
 * Gives the queries of a latency chart.
 *
 * @param buckets - The bucket series of the histogram, in seconds.
 * @param selector - The label matchers of the deliveries.
 * @returns The queries.
 */
function latencyQueries(buckets: string, selector: string) {
  const delivered = `rate(${buckets}{${selector},${succeeded}}[5m])`;

  return {
    p50Query: `histogram_quantile(0.5, sum by (le) (${delivered})) * 1000`,
    p95Query: `histogram_quantile(0.95, sum by (le) (${delivered})) * 1000`,
    p99Query: `histogram_quantile(0.99, sum by (le) (${delivered})) * 1000`,
  };
}

/**
 * Gives the key and queries of each chart of a resource's events, leaving out the control plane
 * charts that every resource has.
 *
 * @param target - The resource.
 * @returns The key and queries of each chart.
 */
function dataPlaneCharts(target: KnativeEventingTarget) {
  return getKnativeEventingChartConfigs(target, translate)
    .filter(({ key }) => key !== 'admission' && key !== 'reconciles')
    .map(({ key, queries }) => [key, queries]);
}

/**
 * Gives the query for the events waiting in some Kafka consumer groups, counting a partition
 * without a committed offset as 0.
 *
 * @param matchers - The label matchers of the consumer groups.
 * @returns The query.
 */
function kafkaQueue(matchers: string) {
  return `sum(clamp_min(kafka_consumergroup_lag{${matchers}}, 0))`;
}

/**
 * Gives the query for the events waiting in some JetStream consumers, as their leaders count them.
 *
 * @param consumers - The consumer names, as a regular expression alternation.
 * @returns The query.
 */
function natsQueue(consumers: string) {
  return (
    'sum({__name__=~"jetstream_consumer_num_(ack_)?pending",' +
    `consumer_name=~"(${consumers})",is_consumer_leader="true"})`
  );
}

/**
 * Builds Subscription `process` to an InMemoryChannel in namespace `shared`.
 *
 * @param namespace - The Subscription's namespace.
 * @param channelName - The name of the InMemoryChannel.
 * @returns The Subscription.
 */
function processTo(namespace: string, channelName: string): KnativeEventingTarget {
  return {
    kind: 'Subscription',
    namespace,
    name: 'process',
    uid: namespace,
    controlPlane: subscriptionPlane,
    channel: { kind: 'InMemoryChannel', namespace: 'shared', name: channelName },
  };
}

describe('Knative Eventing chart configuration', () => {
  test("charts a Broker's deliveries, then the admission requests and reconciles for it", () => {
    const broker =
      'kn_broker_namespace="shop",kn_broker_name="default",' +
      'messaging_destination_name=~"trigger:.*"';
    const admission =
      'kn_webhook_handler_duration_seconds_count{' +
      'kn_webhook_resource_group="eventing.knative.dev",' +
      'kn_webhook_resource_kind="Broker",kn_webhook_subresource=""';
    const queue = 'name="knative.dev.eventing.pkg.reconciler.broker.Reconciler"';
    const target: KnativeEventingTarget = {
      kind: 'Broker',
      namespace: 'shop',
      name: 'default',
      controlPlane: brokerPlane,
    };

    expect(getKnativeEventingChartConfigs(target, translate)).toEqual([
      {
        key: 'deliveries',
        label: 'Deliveries',
        icon: 'mdi:send-check',
        queries: deliveryQueries(dispatchCount, broker),
        component: KnativeEventingStatusChart,
      },
      {
        key: 'latency',
        label: 'Delivery latency',
        icon: 'mdi:timer-outline',
        queries: latencyQueries(dispatchBuckets, broker),
        component: KnativeEventingLatencyChart,
      },
      {
        key: 'admission',
        label: 'Admission requests',
        icon: 'mdi:shield-check-outline',
        queries: {
          succeeded: {
            query:
              `max(sum by (job, container) (rate(${admission},kn_webhook_type="validation",` +
              'kn_webhook_operation_status="success"}[5m]))) ' +
              'or 0 * group(kn_webhook_handler_duration_seconds_count)',
            name: 'Allowed',
          },
          failed: {
            query:
              `max(sum by (job, container) (rate(${admission},` +
              'kn_webhook_type=~"defaulting|validation",' +
              'kn_webhook_operation_status="failure"}[5m]))) ' +
              'or 0 * group(kn_webhook_handler_duration_seconds_count)',
            name: 'Rejected',
          },
          axisLabel: 'Requests per second',
        },
        component: KnativeEventingStatusChart,
      },
      {
        key: 'reconciles',
        label: 'Reconciles',
        icon: 'mdi:sync',
        queries: {
          reconciledQuery: `sum(rate(kn_workqueue_process_duration_seconds_count{${queue}}[5m]))`,
          requeuedQuery: `sum(rate(kn_workqueue_retries_total{${queue}}[5m]))`,
        },
        component: KnativeEventingReconcileChart,
      },
    ]);
  });

  test('leaves out the reconciles of a kind whose reconciler is not known', () => {
    const target: KnativeEventingTarget = {
      kind: 'Resource',
      namespace: 'shop',
      name: 'default',
      controlPlane: { group: 'eventing.knative.dev', kind: 'Broker' },
    };

    expect(getKnativeEventingChartConfigs(target, translate).map(({ key }) => key)).toEqual([
      'admission',
    ]);
  });

  const channelLabels = 'kn_channel_namespace="shop",kn_channel_name="orders"';
  const kafkaChannel = 'kn_kafkachannel_namespace="shop",kn_kafkachannel_name="orders.eu"';
  const apiServerSource =
    'namespace="shop",eventing_knative_dev_sourceName="orders",' +
    'http_request_method="POST",url_template=""';
  const kafkaGroups = String.raw`kafka\\.shop\\.orders\\.eu\\.(a1|b2)`;

  test.each<[string, KnativeEventingTarget, unknown[]]>([
    [
      'a Trigger by the name the Broker filter gives it',
      triggerOf('MTChannelBasedBroker'),
      [
        [
          'deliveries',
          deliveryQueries(dispatchCount, 'messaging_destination_name="trigger:catch-all.shop"'),
        ],
        [
          'latency',
          latencyQueries(dispatchBuckets, 'messaging_destination_name="trigger:catch-all.shop"'),
        ],
      ],
    ],
    [
      'the events a Kafka Broker received',
      { kind: 'KafkaBroker', namespace: 'shop', name: 'orders', controlPlane: brokerPlane },
      [
        [
          'received',
          receivedQueries(kafkaCount, 'kn_broker_namespace="shop",kn_broker_name="orders"'),
        ],
      ],
    ],
    [
      "a Kafka Broker's Trigger and the events waiting in its consumer group",
      {
        kind: 'KafkaTrigger',
        namespace: 'shop',
        name: 'orders',
        consumerGroup: 'knative-trigger-shop-orders',
        controlPlane: brokerPlane,
      },
      [
        [
          'deliveries',
          deliveryQueries(kafkaCount, 'kn_trigger_namespace="shop",kn_trigger_name="orders"'),
        ],
        ['queue', { queuedQuery: kafkaQueue('consumergroup="knative-trigger-shop-orders"') }],
      ],
    ],
    [
      'only the deliveries of a KafkaSource whose consumer group is not known',
      {
        kind: 'KafkaSource',
        namespace: 'shop',
        name: 'orders',
        topics: ['orders'],
        controlPlane: brokerPlane,
      },
      [
        [
          'deliveries',
          deliveryQueries(
            kafkaCount,
            'kn_kafkasource_namespace="shop",kn_kafkasource_name="orders"'
          ),
        ],
      ],
    ],
    [
      'a KafkaSource and the events of its topics waiting in its consumer group',
      {
        kind: 'KafkaSource',
        namespace: 'shop',
        name: 'orders',
        consumerGroup: 'payments-source',
        topics: ['orders', 'orders.v1'],
        controlPlane: brokerPlane,
      },
      [
        [
          'deliveries',
          deliveryQueries(
            kafkaCount,
            'kn_kafkasource_namespace="shop",kn_kafkasource_name="orders"'
          ),
        ],
        [
          'queue',
          {
            queuedQuery: kafkaQueue(
              String.raw`consumergroup="payments-source",topic=~"(orders|orders\\.v1)"`
            ),
          },
        ],
      ],
    ],
    [
      'the events an InMemoryChannel received and delivered',
      { kind: 'InMemoryChannel', namespace: 'shop', name: 'orders', controlPlane: brokerPlane },
      [
        ['received', receivedQueries('http_server_request_duration_seconds_count', channelLabels)],
        ['deliveries', deliveryQueries(dispatchCount, channelLabels)],
        ['latency', latencyQueries(dispatchBuckets, channelLabels)],
      ],
    ],
    [
      "a KafkaChannel's events and the events waiting for its Subscriptions",
      {
        kind: 'KafkaChannel',
        namespace: 'shop',
        name: 'orders.eu',
        subscriptionUids: ['a1', 'b2'],
        controlPlane: brokerPlane,
      },
      [
        [
          'received',
          receivedQueries(kafkaCount, `${kafkaChannel},messaging_consumer_group_name=""`),
        ],
        [
          'deliveries',
          deliveryQueries(kafkaCount, `${kafkaChannel},messaging_consumer_group_name!=""`),
        ],
        ['queue', { queuedQuery: kafkaQueue(`consumergroup=~"${kafkaGroups}"`) }],
      ],
    ],
    [
      'the events a NatsJetStreamChannel received and the events waiting in its consumers',
      {
        kind: 'NatsJetStreamChannel',
        namespace: 'shop',
        name: 'orders',
        subscriptionUids: ['ab-12-cd-34-ef', 'gh-56-ij-78-kl'],
        controlPlane: brokerPlane,
      },
      [
        ['received', receivedQueries('http_server_request_duration_seconds_count', channelLabels)],
        ['queue', { queuedQuery: natsQueue('KN_SUB_AB12CD34EF|KN_SUB_GH56IJ78KL') }],
      ],
    ],
    [
      'a Subscription to an InMemoryChannel by its channel and the name its dispatcher gives it',
      subscriptionTo({ kind: 'InMemoryChannel', namespace: 'billing', name: 'o' }),
      [
        ['deliveries', deliveryQueries(dispatchCount, subscriptionToO)],
        ['latency', latencyQueries(dispatchBuckets, subscriptionToO)],
      ],
    ],
    [
      'the events waiting for a Subscription to a KafkaChannel',
      subscriptionTo({ kind: 'KafkaChannel', namespace: 'billing', name: 'orders' }),
      [['queue', { queuedQuery: kafkaQueue('consumergroup="kafka.billing.orders.c3"') }]],
    ],
    [
      'the events waiting for a Subscription to a NatsJetStreamChannel',
      subscriptionTo({ kind: 'NatsJetStreamChannel', namespace: 'shop', name: 'orders' }),
      [['queue', { queuedQuery: natsQueue('KN_SUB_C3') }]],
    ],
    ['no events of a Trigger whose Broker is not read yet', triggerOf(), []],
    [
      'no events of a Subscription whose channel implementation is not known',
      subscriptionTo({ kind: 'Channel', namespace: 'shop', name: 'orders' }),
      [],
    ],
    [
      'the events an ApiServerSource sent, counting those that got no answer as failed',
      { kind: 'ApiServerSource', namespace: 'shop', name: 'orders', controlPlane: brokerPlane },
      [
        [
          'deliveries',
          deliveryQueries(
            'http_client_request_duration_seconds_count',
            apiServerSource,
            'http_response_status_code!~"2.."'
          ),
        ],
        ['latency', latencyQueries('http_client_request_duration_seconds_bucket', apiServerSource)],
      ],
    ],
    [
      'no events of a PingSource',
      { kind: 'Resource', namespace: 'shop', name: 'orders', controlPlane: brokerPlane },
      [],
    ],
  ])('charts %s', (_, target, charts) => {
    expect(dataPlaneCharts(target)).toEqual(charts);
  });

  test('counts only the topics of a KafkaSource whose consumer group another source shares', () => {
    const [ordersQueue, paymentsQueue] = ['orders', 'payments'].map(
      topic =>
        dataPlaneCharts({
          kind: 'KafkaSource',
          namespace: 'shop',
          name: topic,
          consumerGroup: 'shared',
          topics: [topic],
          controlPlane: brokerPlane,
        })[1]
    );

    expect(ordersQueue).not.toEqual(paymentsQueue);
  });

  test('tells apart Subscriptions that the InMemoryChannel dispatcher gives the same name', () => {
    expect(dataPlaneCharts(processTo('team-a', 'orders'))).not.toEqual(
      dataPlaneCharts(processTo('team-b', 'payments'))
    );
  });

  test('finds no events waiting for a KafkaChannel without Subscriptions', () => {
    const target: KnativeEventingTarget = {
      kind: 'KafkaChannel',
      namespace: 'shop',
      name: 'orders',
      subscriptionUids: [],
      controlPlane: brokerPlane,
    };
    const groups = String.raw`kafka\\.shop\\.orders\\.()`;

    expect(dataPlaneCharts(target)[2]).toEqual([
      'queue',
      { queuedQuery: kafkaQueue(`consumergroup=~"${groups}"`) },
    ]);
  });

  test('escapes names before putting them in PromQL', () => {
    const [broker] = getKnativeEventingChartConfigs(
      { kind: 'Broker', namespace: 'team"one', name: 'b\\one', controlPlane: brokerPlane },
      translate
    );
    const [, source] = getKnativeEventingChartConfigs(
      {
        kind: 'KafkaSource',
        namespace: 'shop',
        name: 'orders',
        consumerGroup: 'g"one\\',
        topics: ['o.one'],
        controlPlane: brokerPlane,
      },
      translate
    );
    const [trigger] = getKnativeEventingChartConfigs(
      {
        kind: 'Trigger',
        namespace: 'team"one',
        name: 't\\one',
        controlPlane: brokerPlane,
        broker: { namespace: 'team"one', name: 'b', brokerClass: 'MTChannelBasedBroker' },
      },
      translate
    );

    expect(broker.queries).toMatchObject({
      succeeded: {
        query: expect.stringContaining(
          'kn_broker_namespace="team\\"one",kn_broker_name="b\\\\one"'
        ),
      },
    });
    expect(trigger.queries).toMatchObject({
      succeeded: {
        query: expect.stringContaining('messaging_destination_name="trigger:t\\\\one.team\\"one"'),
      },
    });
    expect(source.queries).toEqual({
      queuedQuery: kafkaQueue(String.raw`consumergroup="g\"one\\",topic=~"(o\\.one)"`),
    });
  });

  test.each<[string, KnativeEventingTarget, string, string[]]>([
    [
      'deliveries',
      { kind: 'Broker', namespace: 'shop', name: 'default', controlPlane: brokerPlane },
      'deliveries',
      ['t(Succeeded)', 't(Failed)', 't(Deliveries per second)'],
    ],
    [
      'events received',
      { kind: 'KafkaBroker', namespace: 'shop', name: 'default', controlPlane: brokerPlane },
      'received',
      ['t(Accepted)', 't(Rejected)', 't(Events per second)'],
    ],
    [
      'admission requests',
      { kind: 'Resource', namespace: 'shop', name: 'default', controlPlane: brokerPlane },
      'admission',
      ['t(Allowed)', 't(Rejected)', 't(Requests per second)'],
    ],
  ])('translates the line and axis names of the %s chart', (_, target, key, names) => {
    const chart = getKnativeEventingChartConfigs(target, label => `t(${label})`).find(
      config => config.key === key
    );

    expect(chart?.queries).toMatchObject({
      succeeded: { name: names[0] },
      failed: { name: names[1] },
      axisLabel: names[2],
    });
  });
});

/**
 * Renders a chart in StrictMode.
 *
 * @param chart - The chart.
 * @returns The rendered chart.
 */
function renderChart(chart: ReactNode) {
  return render(<StrictMode>{chart}</StrictMode>);
}

/**
 * Gives the name, query, colors and stacking of each line the shared chart last drew.
 *
 * @returns The lines.
 */
function drawnLines() {
  return recorded.chart?.plots.map(({ name, query, strokeColor, fillColor, stackId }) => [
    name,
    query,
    strokeColor,
    fillColor,
    stackId,
  ]);
}

/**
 * Renders the chart of succeeded and failed deliveries.
 *
 * @param props - The query and line name of the failed deliveries, and the settings that differ
 *   from `settings`.
 * @returns The chart.
 */
function StatusChart({
  failedQuery = 'bad',
  failedName = 'Failed',
  ...changedSettings
}: {
  /** The query of the failed deliveries. */
  failedQuery?: string;
  /** The name of the failed deliveries' line. */
  failedName?: string;
  /** The time range shown. */
  timespan?: string;
  /** The resolution of the chart. */
  resolution?: string;
  /** The Prometheus service or pod to query. */
  prometheusPrefix?: string;
  /** The sub path of the Prometheus API. */
  subPath?: string;
}) {
  return (
    <KnativeEventingStatusChart
      {...settings}
      {...changedSettings}
      succeeded={{ query: 'ok', name: 'Succeeded' }}
      failed={{ query: failedQuery, name: failedName }}
      axisLabel="Deliveries per second"
    />
  );
}

const toPayments = subscriptionTo({ kind: 'Channel', namespace: 'billing', name: 'payments' });

/**
 * Builds Channel `payments` in namespace `billing` as reading it returns it.
 *
 * @param implementation - The kind of the channel implementation its status names, if any.
 * @returns The Channel.
 */
function paymentsChannel(implementation?: string): EventingResource {
  return {
    jsonData: {
      kind: 'Channel',
      apiVersion: 'messaging.knative.dev/v1',
      metadata: { name: 'payments', namespace: 'billing', uid: 'e5' },
      status: implementation ? { channel: { kind: implementation } } : undefined,
    },
  };
}

/**
 * Builds a Broker named `default` as reading it returns it.
 *
 * @param brokerClass - The class its annotation names, if any.
 * @param namespace - The Broker's namespace.
 * @returns The Broker.
 */
function defaultBroker(brokerClass?: string, namespace = 'shop'): EventingResource {
  return {
    jsonData: {
      kind: 'Broker',
      apiVersion: 'eventing.knative.dev/v1',
      metadata: {
        name: 'default',
        namespace,
        uid: 'f6',
        annotations: brokerClass ? { 'eventing.knative.dev/broker.class': brokerClass } : undefined,
      },
    },
  };
}

describe('Knative Eventing charts', () => {
  beforeEach(() => {
    recorded.chart = undefined;
    recorded.switcher = undefined;
    recorded.readItems = undefined;
    recorded.readError = undefined;
    recorded.readSkipped = undefined;
    recorded.readRequest = undefined;
    recorded.metricsCluster = 'main';
    recorded.clusterConfig = { main: { isMetricsEnabled: true } };
    recorded.tooltip = undefined;
    recorded.switcherMounts = 0;
    recorded.chartMounts = 0;
  });

  test('stacks the failed rate in red on the succeeded one in green', () => {
    renderChart(<StatusChart />);

    expect(drawnLines()).toEqual([
      ['Succeeded', 'ok', '#4caf50', 'rgba(76, 175, 80, 0.15)', 'lines'],
      ['Failed', 'bad', '#f44336', 'rgba(244, 67, 54, 0.15)', 'lines'],
    ]);
    expect(recorded.chart?.yAxisProps).toMatchObject({
      tickCount: 5,
      allowDecimals: true,
      label: { value: 'Deliveries per second' },
    });
    expect(recorded.chart).toMatchObject({
      prometheusPrefix: 'monitoring/pods/prometheus-0:9090',
      autoRefresh: true,
      interval: '1h',
      resolution: 'medium',
      subPath: '',
    });
  });

  test('draws the reconciles and the requeues on their own', () => {
    renderChart(
      <KnativeEventingReconcileChart {...settings} reconciledQuery="done" requeuedQuery="again" />
    );

    expect(drawnLines()).toEqual([
      ['t(Reconciled)', 'done', '#2196f3', 'rgba(33, 150, 243, 0.15)', null],
      ['t(Requeued)', 'again', '#ff9800', 'rgba(255, 152, 0, 0.15)', null],
    ]);
    expect(recorded.chart?.yAxisProps.label.value).toBe('t(Reconciles per second)');
  });

  test('rounds the value axis up to four round steps from zero', () => {
    renderChart(<StatusChart />);
    const [bottom, getTop] = recorded.chart?.yAxisProps.domain;

    expect(bottom).toBe(0);
    expect([0.038, 0.009, 9, 28, 100, 130, 0].map(getTop)).toEqual([
      0.04, 0.01, 20, 40, 100, 200, 1,
    ]);
  });

  test('formats values with three significant digits, and from 1000 with every digit', () => {
    renderChart(<StatusChart />);
    const format: (value: number) => string = recorded.chart?.yAxisProps.tickFormatter;

    expect(
      [0.1 + 0.2, 0.0166667, 123.4, 999.4, 1234.5, 12345].map(value =>
        format(value).replace(/\D/g, '')
      )
    ).toEqual(['03', '00167', '123', '999', '1235', '12345']);
  });

  test.each<[string, Parameters<typeof StatusChart>[0]]>([
    ['a query', { failedQuery: 'rejected' }],
    ['a line name', { failedName: 'Rejected' }],
    ['the timespan', { timespan: '24h' }],
    ['the resolution', { resolution: 'high' }],
    ['the Prometheus service', { prometheusPrefix: 'monitoring/services/prometheus:9090' }],
    ['the sub path of the Prometheus API', { subPath: 'prometheus' }],
  ])('starts the shared chart again only when %s changes', (_, changed) => {
    const { rerender } = renderChart(<StatusChart />);
    const mounts = recorded.chartMounts;

    rerender(
      <StrictMode>
        <StatusChart />
      </StrictMode>
    );
    expect(recorded.chartMounts).toBe(mounts);

    rerender(
      <StrictMode>
        <StatusChart {...changed} />
      </StrictMode>
    );
    expect(recorded.chartMounts).toBeGreaterThan(mounts);
  });

  test('draws each latency percentile on its own in its own color', () => {
    renderChart(
      <KnativeEventingLatencyChart {...settings} p50Query="a" p95Query="b" p99Query="c" />
    );

    expect(drawnLines()).toEqual([
      ['t(P99 Latency)', 'c', '#f44336', 'rgba(244, 67, 54, 0.15)', null],
      ['t(P95 Latency)', 'b', '#ff9800', 'rgba(255, 152, 0, 0.15)', null],
      ['t(P50 Latency)', 'a', '#2196f3', 'rgba(33, 150, 243, 0.15)', null],
    ]);
    expect(recorded.chart?.yAxisProps).toMatchObject({
      allowDecimals: false,
      tickFormatter: formatLatency,
      label: { value: 't(Latency)' },
    });
  });

  test('draws the queued events on an axis of whole numbers', () => {
    renderChart(<KnativeEventingQueueChart {...settings} queuedQuery="lag" />);
    const [, getTop] = recorded.chart?.yAxisProps.domain;

    expect(drawnLines()).toEqual([
      ['t(Queued)', 'lag', '#ff9800', 'rgba(255, 152, 0, 0.15)', null],
    ]);
    expect(recorded.chart?.yAxisProps).toMatchObject({
      allowDecimals: false,
      label: { value: 't(Events)' },
    });
    expect([0, 0.8, 9, 28, 100].map(getTop)).toEqual([4, 4, 20, 40, 100]);
  });

  test('formats the values in the tooltip as on the value axis', () => {
    renderChart(
      <KnativeEventingLatencyChart
        {...settings}
        p50Query="a"
        p95Query="b"
        p99Query="c"
        CustomTooltip={tooltip => {
          recorded.tooltip = tooltip;
          return null;
        }}
      />
    );
    recorded.chart?.CustomTooltip?.({ active: true, payload: [], label: 60 });

    expect(recorded.tooltip).toEqual({
      active: true,
      payload: [],
      label: 60,
      valueFormatter: formatLatency,
    });
  });

  test("gives the chart switcher the resource's charts with translated labels", () => {
    const target = triggerOf('MTChannelBasedBroker');

    renderChart(<KnativeEventingChart target={target} />);

    expect(recorded.switcher).toEqual({
      chartConfigs: getKnativeEventingChartConfigs(target, key => `t(${key})`),
    });
    expect(recorded.readRequest).toBeUndefined();
  });

  test.each<SubscriptionTarget['channel']['kind']>(['KafkaChannel', 'NatsJetStreamChannel'])(
    "reads a Subscription's Channel to chart the %s behind it",
    implementation => {
      recorded.readItems = [paymentsChannel(implementation)];

      renderChart(<KnativeEventingChart target={toPayments} cluster="east" />);

      expect(recorded.readRequest).toEqual([
        'Channel',
        { cluster: 'east', namespace: 'billing', fieldSelector: 'metadata.name=payments' },
      ]);
      expect(recorded.switcher?.chartConfigs).toEqual(
        getKnativeEventingChartConfigs(
          subscriptionTo({ kind: implementation, namespace: 'billing', name: 'payments' }),
          key => `t(${key})`
        )
      );
    }
  );

  const kafkaTriggerPlane: ControlPlane = {
    group: 'eventing.knative.dev',
    kind: 'Trigger',
    reconciler:
      'knative.dev.eventing-kafka-broker.control-plane.pkg.reconciler.trigger.v2.Reconciler',
  };

  test.each<[string, string | undefined, KnativeEventingTarget, KnativeEventingTarget]>([
    [
      'a default-class Broker, from the Broker filter',
      undefined,
      triggerOf(),
      {
        ...triggerOf('MTChannelBasedBroker'),
        controlPlane: {
          group: 'eventing.knative.dev',
          kind: 'Trigger',
          reconciler: 'knative.dev.eventing.pkg.reconciler.broker.trigger.Reconciler',
        },
      },
    ],
    [
      'a Kafka Broker, from the Kafka dispatcher',
      'Kafka',
      triggerOf(),
      {
        kind: 'KafkaTrigger',
        namespace: 'shop',
        name: 'catch-all',
        controlPlane: kafkaTriggerPlane,
      },
    ],
    [
      'a Kafka Broker, from the Kafka dispatcher and the consumer group the Trigger names',
      'Kafka',
      { ...triggerOf(), consumerGroup: 'knative-trigger-shop-catch-all' },
      {
        kind: 'KafkaTrigger',
        namespace: 'shop',
        name: 'catch-all',
        consumerGroup: 'knative-trigger-shop-catch-all',
        controlPlane: kafkaTriggerPlane,
      },
    ],
  ])("reads a Trigger's Broker to chart the Trigger of %s", (_, brokerClass, target, resolved) => {
    recorded.readItems = [defaultBroker(brokerClass)];

    renderChart(<KnativeEventingChart target={target} cluster="east" />);

    expect(recorded.readRequest).toEqual([
      'Broker',
      { cluster: 'east', namespace: 'shop', fieldSelector: 'metadata.name=default' },
    ]);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(recorded.switcher?.chartConfigs).toEqual(
      getKnativeEventingChartConfigs(resolved, key => `t(${key})`)
    );
  });

  test.each<[string, KnativeEventingTarget, Partial<typeof recorded>, string, string, string[]]>([
    [
      "a Subscription's Channel cannot be read",
      toPayments,
      { readError: new ForbiddenError('channels "payments" is forbidden') },
      't(Could not read {{kind}} {{name}}: {{error}}, ' +
        '{"kind":"Channel","name":"payments","error":"channels \\"payments\\" is forbidden"})',
      'Warning',
      ['admission', 'reconciles'],
    ],
    [
      "a Subscription's Channel is delivered by a channel implementation without metrics",
      toPayments,
      { readItems: [paymentsChannel('RabbitmqChannel')] },
      't(There are no delivery charts for a {{kind}} whose {{reference}} is {{type}}., ' +
        '{"kind":"Subscription","reference":"Channel","type":"RabbitmqChannel"})',
      'Info',
      ['admission', 'reconciles'],
    ],
    [
      "a Trigger's Broker cannot be read",
      triggerOf(),
      { readError: new ForbiddenError('brokers "default" is forbidden') },
      't(Could not read {{kind}} {{name}}: {{error}}, ' +
        '{"kind":"Broker","name":"default","error":"brokers \\"default\\" is forbidden"})',
      'Warning',
      ['admission'],
    ],
    [
      "a Subscription's Channel does not exist",
      toPayments,
      { readItems: [] },
      't(Could not find {{kind}} {{name}}., {"kind":"Channel","name":"payments"})',
      'Warning',
      ['admission', 'reconciles'],
    ],
    [
      "a Trigger's Broker does not exist",
      triggerOf(),
      { readItems: [] },
      't(Could not find {{kind}} {{name}}., {"kind":"Broker","name":"default"})',
      'Warning',
      ['admission'],
    ],
    [
      "a Trigger's Broker of a class without metrics cannot be read again",
      triggerOf(),
      {
        readItems: [defaultBroker('RabbitMQBroker')],
        readError: new ForbiddenError('brokers "default" is forbidden'),
      },
      't(Could not read {{kind}} {{name}}: {{error}}, ' +
        '{"kind":"Broker","name":"default","error":"brokers \\"default\\" is forbidden"})',
      'Warning',
      ['admission'],
    ],
    [
      "a Trigger's Broker is of a class without metrics",
      triggerOf(),
      { readItems: [defaultBroker('RabbitMQBroker')] },
      't(There are no delivery charts for a {{kind}} whose {{reference}} is {{type}}., ' +
        '{"kind":"Trigger","reference":"Broker","type":"RabbitMQBroker"})',
      'Info',
      ['admission'],
    ],
    [
      "a Trigger's Broker is of class KafkaNamespaced, although the Trigger names a consumer group",
      { ...triggerOf(), consumerGroup: 'knative-trigger-shop-catch-all' },
      { readItems: [defaultBroker('KafkaNamespaced')] },
      't(There are no delivery charts for a {{kind}} whose {{reference}} is {{type}}., ' +
        '{"kind":"Trigger","reference":"Broker","type":"KafkaNamespaced"})',
      'Info',
      ['admission'],
    ],
    [
      "a Trigger's Broker exists only in another namespace",
      triggerOf(),
      { readItems: [defaultBroker('Kafka', 'team-a')] },
      't(Could not find {{kind}} {{name}}., {"kind":"Broker","name":"default"})',
      'Warning',
      ['admission'],
    ],
    [
      "a Trigger's Broker is in a namespace that the allowed namespaces leave out",
      triggerOf(),
      { readItems: [], readSkipped: true },
      't(Could not read {{kind}} {{name}}: namespace {{namespace}} is not in the allowed ' +
        'namespaces., {"kind":"Broker","name":"default","namespace":"shop"})',
      'Warning',
      ['admission'],
    ],
  ])('says so when %s', (_, target, read, message, severity, charts) => {
    Object.assign(recorded, read);

    renderChart(<KnativeEventingChart target={target} />);

    expect(screen.getByRole('alert').textContent).toBe(message);
    expect(screen.getByRole('alert').className).toContain(`MuiAlert-standard${severity}`);
    expect(recorded.switcher?.chartConfigs.map(({ key }) => key)).toEqual(charts);
  });

  test.each<[string, KnativeEventingTarget, string, string, string]>([
    ['the Channel of a Subscription', toPayments, 'Channel', 'billing', 'payments'],
    ['the Broker of a Trigger', triggerOf(), 'Broker', 'shop', 'default'],
  ])('shows nothing while %s is read', (_, target, kind, namespace, name) => {
    renderChart(<KnativeEventingChart target={target} />);

    expect(recorded.readRequest).toEqual([
      kind,
      { cluster: undefined, namespace, fieldSelector: `metadata.name=${name}` },
    ]);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(recorded.switcher).toBeUndefined();
  });

  test('keeps the charts of what it last read when the Broker cannot be read again', () => {
    recorded.readItems = [defaultBroker()];
    recorded.readError = new ForbiddenError('brokers "default" is forbidden');

    renderChart(<KnativeEventingChart target={triggerOf()} />);

    expect(screen.getByRole('alert').className).toContain('MuiAlert-standardWarning');
    expect(recorded.switcher?.chartConfigs.map(({ key }) => key)).toEqual([
      'deliveries',
      'latency',
      'admission',
      'reconciles',
    ]);
  });

  test('charts only the control plane while the Channel names no implementation', () => {
    recorded.readItems = [paymentsChannel()];

    renderChart(<KnativeEventingChart target={toPayments} />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(recorded.switcher?.chartConfigs.map(({ key }) => key)).toEqual([
      'admission',
      'reconciles',
    ]);
  });

  test('starts the chart switcher again only when its first chart changes', () => {
    const resource: KnativeEventingTarget = {
      kind: 'Resource',
      namespace: 'shop',
      name: 'catch-all',
      controlPlane: brokerPlane,
    };
    const trigger = triggerOf('MTChannelBasedBroker');
    const kafkaTrigger: KnativeEventingTarget = {
      ...trigger,
      kind: 'KafkaTrigger',
      consumerGroup: 'knative-trigger-shop-orders',
    };
    const { rerender } = renderChart(<KnativeEventingChart target={trigger} />);
    const mounts = recorded.switcherMounts;

    rerender(
      <StrictMode>
        <KnativeEventingChart target={{ ...trigger }} />
      </StrictMode>
    );
    expect(recorded.switcherMounts).toBe(mounts);

    rerender(
      <StrictMode>
        <KnativeEventingChart target={kafkaTrigger} />
      </StrictMode>
    );
    expect(recorded.switcherMounts).toBe(mounts);
    expect(recorded.switcher?.chartConfigs.map(({ key }) => key)).toEqual([
      'deliveries',
      'queue',
      'admission',
    ]);

    rerender(
      <StrictMode>
        <KnativeEventingChart target={resource} />
      </StrictMode>
    );
    const afterAdmissionFirst = recorded.switcherMounts;
    expect(afterAdmissionFirst).toBeGreaterThan(mounts);

    rerender(
      <StrictMode>
        <KnativeEventingChart target={trigger} />
      </StrictMode>
    );
    expect(recorded.switcherMounts).toBeGreaterThan(afterAdmissionFirst);
  });

  test.each([
    ['the Channel of a Subscription', toPayments],
    ['the Broker of a Trigger', triggerOf()],
  ])('does not read %s while metrics are off for the cluster', (_, target) => {
    recorded.clusterConfig = { main: { isMetricsEnabled: false } };

    renderChart(<KnativeEventingChart target={target} />);

    expect(recorded.readRequest).toBeUndefined();
    expect(recorded.switcher).toBeUndefined();
  });
});
