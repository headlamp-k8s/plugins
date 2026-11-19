import React from 'react';
import { render, screen } from '@testing-library/react';
import { _resetStrimziApiVersionCache } from '../utils/strimziApiVersion';
import { KafkaConnectorList } from './KafkaConnectorList';
import { KafkaList } from './KafkaList';

// API discovery on a cluster without Strimzi: no kafka.strimzi.io group.
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn(async () => ({ groups: [{ name: 'apps', versions: [] }] })) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ResourceListView: () => <div>resource list</div>,
  SectionBox: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock('./KafkaTopologyModal', () => ({
  KafkaTopologyModal: () => null,
}));

// The resource classes need Headlamp's k8s module, which only exists inside the app.
vi.mock('../resources/kafka', () => ({ Kafka: class {} }));
vi.mock('../resources/kafkaConnector', () => ({ KafkaConnector: class {} }));

describe('Strimzi list pages on a cluster without Strimzi', () => {
  beforeEach(() => {
    _resetStrimziApiVersionCache();
  });

  it.each([
    ['KafkaList', KafkaList],
    ['KafkaConnectorList', KafkaConnectorList],
  ])('%s shows the not installed message once API discovery finishes', async (_, Component) => {
    render(<Component />);

    // The first render happens while discovery is still running.
    expect(screen.getByText('resource list')).toBeTruthy();
    expect(await screen.findByText('Strimzi not detected')).toBeTruthy();
  });
});
