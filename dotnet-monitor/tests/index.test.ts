import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerDetailsViewHeaderActionsProcessor = vi.fn();
const registerPluginSettings = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: class {
    useConfig() {
      return () => ({});
    }
  },
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
}));

vi.mock('../src/components/DotnetMonitorHeaderAction', () => ({
  DotnetMonitorHeaderAction: () => null,
}));

describe('plugin registration', () => {
  beforeEach(() => {
    registerDetailsViewHeaderActionsProcessor.mockClear();
    registerPluginSettings.mockClear();
  });

  it('registers the pod header action and plugin settings', async () => {
    await import('../src/index');

    expect(registerDetailsViewHeaderActionsProcessor).toHaveBeenCalledTimes(1);
    expect(registerPluginSettings).toHaveBeenCalledWith('headlamp-dotnet-monitor', expect.any(Function), true);
  });
});
