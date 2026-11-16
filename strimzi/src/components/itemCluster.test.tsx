import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KafkaConnectorList } from './KafkaConnectorList';
import { KafkaTopicList } from './KafkaTopicList';
import { KafkaUserList } from './KafkaUserList';

const { mockRequest, shown } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  // The one row the list shows, with the cluster it was listed from.
  shown: { row: null as unknown },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: mockRequest },
}));

// Only the action buttons of one row are needed, so render just the actions column.
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ResourceListView: ({
    columns,
  }: {
    columns: Array<{ id?: string; render?: (item: unknown) => React.ReactNode }>;
  }) => <div>{columns.find(column => column.id === 'actions')?.render?.(shown.row)}</div>,
}));

vi.mock('../resources', () => ({
  Kafka: { useList: () => ({ items: [] }) },
  KafkaTopic: class {},
  KafkaUser: class {},
}));

vi.mock('../resources/kafkaConnector', () => ({
  KafkaConnector: class {},
}));

vi.mock('../hooks/useStrimziApiVersions', () => ({
  useStrimziApiVersions: () => ({ ready: true, installed: true, kafka: 'v1', core: 'v1' }),
}));

const metadata = { namespace: 'kafka', labels: { 'strimzi.io/cluster': 'my-cluster' } };
const topic = {
  kind: 'KafkaTopic',
  metadata: { ...metadata, name: 'orders' },
  spec: { partitions: 3, replicas: 1 },
};
const user = {
  kind: 'KafkaUser',
  metadata: { ...metadata, name: 'app-user' },
  spec: { authentication: { type: 'scram-sha-512' } },
};
const connector = {
  kind: 'KafkaConnector',
  metadata: { ...metadata, name: 'sink' },
  spec: { state: 'running' },
};

function confirmIn(dialogButton: string) {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: dialogButton }));
}

describe('actions on a row from another cluster', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ data: { password: btoa('secret') } });
  });

  it('deletes a topic in its own cluster', async () => {
    shown.row = { jsonData: topic, cluster: 'cluster-b' };
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    confirmIn('Delete');

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/kafka.strimzi.io/v1/namespaces/kafka/kafkatopics/orders',
      { method: 'DELETE', cluster: 'cluster-b' }
    );
  });

  it('updates a topic in its own cluster', async () => {
    shown.row = { jsonData: topic, cluster: 'cluster-b' };
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    const [path, params] = mockRequest.mock.calls[0];
    expect(path).toBe('/apis/kafka.strimzi.io/v1/namespaces/kafka/kafkatopics/orders');
    expect(params).toMatchObject({ method: 'PUT', cluster: 'cluster-b' });
  });

  it('reads the secret of a user and deletes the user in its own cluster', async () => {
    shown.row = { jsonData: user, cluster: 'cluster-b' };
    render(<KafkaUserList />);
    fireEvent.click(screen.getByRole('button', { name: 'View Secret' }));
    await waitFor(() =>
      expect(mockRequest).toHaveBeenCalledWith('/api/v1/namespaces/kafka/secrets/app-user', {
        cluster: 'cluster-b',
      })
    );

    mockRequest.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    confirmIn('Delete');
    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/kafka.strimzi.io/v1/namespaces/kafka/kafkausers/app-user',
      { method: 'DELETE', cluster: 'cluster-b' }
    );
  });

  it('pauses a connector in its own cluster', async () => {
    shown.row = { jsonData: connector, cluster: 'cluster-b', desiredState: 'running' };
    render(<KafkaConnectorList />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    confirmIn('Confirm');

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    const [path, params] = mockRequest.mock.calls[0];
    expect(path).toBe('/apis/kafka.strimzi.io/v1/namespaces/kafka/kafkaconnectors/sink');
    expect(params).toMatchObject({ method: 'PATCH', cluster: 'cluster-b' });
  });

  it('keeps using the current cluster when the row has no cluster', async () => {
    shown.row = { jsonData: topic };
    render(<KafkaTopicList />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    confirmIn('Delete');

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    // A `cluster: undefined` key would make ApiProxy.request drop the current cluster.
    expect(mockRequest.mock.calls[0][1]).toEqual({ method: 'DELETE' });
  });
});
