import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KafkaTopicList } from './KafkaTopicList';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

const topic = {
  apiVersion: 'kafka.strimzi.io/v1beta2',
  kind: 'KafkaTopic',
  metadata: { name: 'orders', namespace: 'kafka', labels: { 'strimzi.io/cluster': 'my-cluster' } },
  spec: {
    partitions: 3,
    replicas: 1,
    config: {
      'retention.ms': '60000',
      'compression.type': 'gzip',
      'min.insync.replicas': '2',
      'cleanup.policy': 'compact',
    },
  },
};
// The topic shown in the list. A test can swap it for one with a different config.
let shownTopic: unknown = topic;

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: mockRequest },
}));

// Only the Edit button of one topic row is needed, so render just the actions column.
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ResourceListView: ({
    columns,
  }: {
    columns: Array<{ id?: string; render?: (item: unknown) => React.ReactNode }>;
  }) => (
    <div>{columns.find(column => column.id === 'actions')?.render?.({ jsonData: shownTopic })}</div>
  ),
}));

vi.mock('../resources', () => ({
  Kafka: { useList: () => ({ items: [] }) },
  KafkaTopic: class {},
}));

vi.mock('../hooks/useStrimziApiVersions', () => ({
  useStrimziApiVersions: () => ({ ready: true, installed: true, kafka: 'v1beta2' }),
}));

async function saveTopic() {
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalled());
  const [url, options] = mockRequest.mock.calls[0];
  expect(url).toBe('/apis/kafka.strimzi.io/v1beta2/namespaces/kafka/kafkatopics/orders');
  expect(options.method).toBe('PUT');
  return JSON.parse(options.body).spec.config;
}

describe('KafkaTopicList edit', () => {
  beforeEach(() => {
    shownTopic = topic;
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({});
  });

  it('keeps a setting set to 0 when it is not touched', async () => {
    shownTopic = {
      ...topic,
      spec: { ...topic.spec, config: { 'retention.ms': 0, 'cleanup.policy': 'compact' } },
    };
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(await saveTopic()).toEqual({ 'retention.ms': '0', 'cleanup.policy': 'compact' });
  });

  it('removes the settings that were cleared in the form', async () => {
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    fireEvent.change(screen.getByPlaceholderText('Optional, e.g., 604800000 (7 days)'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByDisplayValue('gzip'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Optional, e.g., 2'), { target: { value: '' } });

    expect(await saveTopic()).toEqual({ 'cleanup.policy': 'compact' });
  });

  it('saves changed settings and keeps the rest of the config', async () => {
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    fireEvent.change(screen.getByPlaceholderText('Optional, e.g., 604800000 (7 days)'), {
      target: { value: '120000' },
    });

    expect(await saveTopic()).toEqual({
      'retention.ms': '120000',
      'compression.type': 'gzip',
      'min.insync.replicas': '2',
      'cleanup.policy': 'compact',
    });
  });
});
