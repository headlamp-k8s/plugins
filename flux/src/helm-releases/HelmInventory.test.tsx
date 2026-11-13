import { act, render, screen, waitFor } from '@testing-library/react';
import { Base64 } from 'js-base64';
import { gzipSync } from 'node:zlib';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelmInventory } from './Inventory';

const mocks = vi.hoisted(() => ({
  secrets: [] as unknown[],
  request: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    K8s: {
      ...actual.K8s,
      ResourceClasses: {
        ...actual.K8s.ResourceClasses,
        Secret: { useList: () => [mocks.secrets] },
      },
    },
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string>) =>
        key.replace(/{{(\w+)}}/g, (_, name) => options?.[name] ?? ''),
    }),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  request: (...args: unknown[]) => mocks.request(...args),
}));

// Render each resource name so the tests can see which inventory is displayed.
vi.mock('../common/Table', () => ({
  default: ({ data }: { data: Array<{ metadata: { name: string } }> }) => (
    <ul>
      {data.map(item => (
        <li key={item.metadata.name}>{item.metadata.name}</li>
      ))}
    </ul>
  ),
}));

const CONFIG_MAP_TEMPLATE = {
  data: Base64.encode('apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: x\n'),
};

/** Builds a Helm release secret: base64(base64(gzip(json))), as stored by Helm. */
function helmSecret(release: unknown, version = '1') {
  const gz = gzipSync(Buffer.from(JSON.stringify(release)));
  return {
    metadata: { labels: { version } },
    data: { release: Base64.encode(gz.toString('base64')) },
  };
}

function releaseWithConfigMap() {
  return { chart: { templates: [CONFIG_MAP_TEMPLATE] } };
}

function listOf(...names: string[]) {
  return { items: names.map(name => ({ metadata: { name } })) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const flush = () => act(async () => new Promise(resolve => setTimeout(resolve, 50)));

describe('HelmInventory', () => {
  beforeEach(() => {
    mocks.secrets = [];
    mocks.request.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the resources deployed by the release', async () => {
    mocks.secrets = [helmSecret(releaseWithConfigMap())];
    mocks.request.mockResolvedValue(listOf('my-config'));

    render(<HelmInventory name="chart" namespace="ns" />);

    expect(await screen.findByText('my-config')).toBeTruthy();
    expect(screen.queryByText(/Failed to load/)).toBeNull();
  });

  it('shows an inline error when the release data is not valid gzip', async () => {
    mocks.secrets = [
      {
        metadata: { labels: { version: '1' } },
        data: { release: Base64.encode(Buffer.from('not gzip').toString('base64')) },
      },
    ];

    render(<HelmInventory name="chart" namespace="ns" />);

    expect(await screen.findByText(/Failed to load the Helm release inventory/)).toBeTruthy();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('shows an inline error when the decoded release has no chart templates', async () => {
    mocks.secrets = [helmSecret({ chart: {} })];

    render(<HelmInventory name="chart" namespace="ns" />);

    expect(await screen.findByText(/has no chart templates/)).toBeTruthy();
  });

  it('treats an explicitly empty templates array as an empty inventory, not an error', async () => {
    mocks.secrets = [helmSecret({ chart: { templates: [] } })];

    render(<HelmInventory name="chart" namespace="ns" />);
    await flush();

    expect(screen.queryByText(/Failed to load/)).toBeNull();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('shows an inline error when a resource request fails with a non-404 status', async () => {
    mocks.secrets = [helmSecret(releaseWithConfigMap())];
    mocks.request.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));

    render(<HelmInventory name="chart" namespace="ns" />);

    expect(
      await screen.findByText(/Failed to load the Helm release inventory: forbidden/)
    ).toBeTruthy();
  });

  it('does not show an error when a resource kind returns 404', async () => {
    mocks.secrets = [helmSecret(releaseWithConfigMap())];
    mocks.request.mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));

    render(<HelmInventory name="chart" namespace="ns" />);
    await flush();

    expect(screen.queryByText(/Failed to load/)).toBeNull();
  });

  it('clears a previous inventory when no usable release secret remains', async () => {
    mocks.secrets = [helmSecret(releaseWithConfigMap())];
    mocks.request.mockResolvedValue(listOf('my-config'));
    const { rerender } = render(<HelmInventory name="chart" namespace="ns" />);
    expect(await screen.findByText('my-config')).toBeTruthy();

    mocks.secrets = [];
    rerender(<HelmInventory name="chart" namespace="ns" />);

    await waitFor(() => expect(screen.queryByText('my-config')).toBeNull());
  });

  it('does not let a superseded run overwrite newer resources', async () => {
    const slow = deferred<unknown>();
    mocks.request.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(listOf('new-config'));

    mocks.secrets = [helmSecret(releaseWithConfigMap(), '1')];
    const { rerender } = render(<HelmInventory name="chart" namespace="ns" />);
    // Let the first run reach its (pending) resource request.
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(1));

    mocks.secrets = [helmSecret(releaseWithConfigMap(), '2')];
    rerender(<HelmInventory name="chart" namespace="ns" />);
    expect(await screen.findByText('new-config')).toBeTruthy();

    await act(async () => {
      slow.resolve(listOf('old-config'));
    });
    await flush();

    expect(screen.queryByText('old-config')).toBeNull();
    expect(screen.getByText('new-config')).toBeTruthy();
  });

  it('does not let a superseded run show an error over newer resources', async () => {
    const slow = deferred<unknown>();
    mocks.request.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(listOf('new-config'));

    mocks.secrets = [helmSecret(releaseWithConfigMap(), '1')];
    const { rerender } = render(<HelmInventory name="chart" namespace="ns" />);
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(1));

    mocks.secrets = [helmSecret(releaseWithConfigMap(), '2')];
    rerender(<HelmInventory name="chart" namespace="ns" />);
    expect(await screen.findByText('new-config')).toBeTruthy();

    await act(async () => {
      slow.resolve(Promise.reject(Object.assign(new Error('late failure'), { status: 500 })));
    });
    await flush();

    expect(screen.queryByText(/late failure/)).toBeNull();
    expect(screen.getByText('new-config')).toBeTruthy();
  });

  it('does not start resource requests for a run cancelled before decompression finishes', async () => {
    mocks.secrets = [helmSecret(releaseWithConfigMap())];

    const { unmount } = render(<HelmInventory name="chart" namespace="ns" />);
    unmount();
    await flush();

    expect(mocks.request).not.toHaveBeenCalled();
  });
});
