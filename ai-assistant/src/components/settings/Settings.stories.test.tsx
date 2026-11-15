import { cleanup, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createDesktopApi,
  createMemoryConfigStore,
} from '../../../packages/ai-ui/src/components/settings/MCPSettings/MCPSettings.stories';
import { SettingsPreview } from './Settings.stories';

vi.mock('./Settings', () => ({
  SettingsRows: () => null,
  SettingsSection: () => null,
}));

vi.mock('@headlamp-k8s/ai-ui/components/settings/SettingsPage', () => ({
  SettingsPage: function BridgeConsumer() {
    const [names, setNames] = useState<string[]>([]);
    useEffect(() => {
      void window.desktopApi?.mcp.getConfig().then(response => {
        if (response.success && response.config) {
          setNames(response.config.servers.map(server => server.name));
        }
      });
    }, []);
    return <p>{names.join(', ')}</p>;
  },
}));

const originalApi = window.desktopApi;

afterEach(() => {
  cleanup();
  window.desktopApi = originalApi;
});

it('installs the isolated bridge before child effects read settings and restores the previous bridge', async () => {
  const previous = createDesktopApi(
    createMemoryConfigStore({
      mcpConfig: {
        enabled: true,
        servers: [
          { name: 'Previous story server', command: 'preview-only', args: [], enabled: false },
        ],
      },
    })
  );
  window.desktopApi = previous;
  const readPrevious = vi.spyOn(previous.mcp, 'getConfig');
  const { unmount } = render(<SettingsPreview />);

  expect(await screen.findByText('Example server')).toBeTruthy();
  expect(screen.queryByText('Previous story server')).toBeNull();
  expect(readPrevious).not.toHaveBeenCalled();
  expect(window.desktopApi).not.toBe(previous);

  unmount();
  expect(window.desktopApi).toBe(previous);
});
