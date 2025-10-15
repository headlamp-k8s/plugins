import { registerPlugin, registerRoute } from '@kinvolk/headlamp-plugin/lib';
import { KafkaList, KafkaDetails } from './components/KafkaList';
import { KafkaTopicList, KafkaTopicDetails } from './components/KafkaTopicList';
import { KafkaUserList, KafkaUserDetails } from './components/KafkaUserList';
import { Kafka, KafkaTopic, KafkaUser } from './crds';

registerPlugin('strimzi', {
  initialize: () => {
    // Register Strimzi CRDs with Headlamp
    [Kafka, KafkaTopic, KafkaUser].forEach(crd => {
      crd.apiEndpoint.apiInfo = {
        group: 'kafka.strimzi.io',
        version: 'v1beta2',
        resource: crd.apiName,
      };
    });

    // Register routes for Kafka clusters
    registerRoute({
      path: '/strimzi/kafkas',
      sidebar: {
        item: 'kafkas',
        parent: 'strimzi',
      },
      name: 'Kafka Clusters',
      exact: true,
      component: () => KafkaList(),
    });

    registerRoute({
      path: '/strimzi/kafka/:namespace/:name',
      name: 'Kafka Cluster Details',
      exact: true,
      component: ({ match }: any) => (
        <KafkaDetails name={match.params.name} namespace={match.params.namespace} />
      ),
    });

    // Register routes for Kafka topics
    registerRoute({
      path: '/strimzi/topics',
      sidebar: {
        item: 'topics',
        parent: 'strimzi',
      },
      name: 'Kafka Topics',
      exact: true,
      component: () => KafkaTopicList(),
    });

    registerRoute({
      path: '/strimzi/topic/:namespace/:name',
      name: 'Kafka Topic Details',
      exact: true,
      component: ({ match }: any) => (
        <KafkaTopicDetails name={match.params.name} namespace={match.params.namespace} />
      ),
    });

    // Register routes for Kafka users
    registerRoute({
      path: '/strimzi/users',
      sidebar: {
        item: 'users',
        parent: 'strimzi',
      },
      name: 'Kafka Users',
      exact: true,
      component: () => KafkaUserList(),
    });

    registerRoute({
      path: '/strimzi/user/:namespace/:name',
      name: 'Kafka User Details',
      exact: true,
      component: ({ match }: any) => (
        <KafkaUserDetails name={match.params.name} namespace={match.params.namespace} />
      ),
    });

    // Add Strimzi section to sidebar
    registerRoute({
      path: '/strimzi',
      sidebar: {
        item: 'strimzi',
        label: 'Strimzi',
        icon: 'mdi:apache-kafka',
      },
      name: 'Strimzi',
      exact: false,
      component: () => null,
    });
  },
});
