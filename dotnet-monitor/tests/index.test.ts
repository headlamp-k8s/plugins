import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const registerAppBarAction = vi.fn();
const registerDetailsViewHeaderActionsProcessor = vi.fn();
const registerPluginSettings = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: class {
    useConfig() {
      return () => ({});
    }
  },
  registerAppBarAction,
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: () => React.createElement('button', null, 'ActionButton'),
}));

describe('plugin registration', () => {
  beforeEach(() => {
    registerAppBarAction.mockClear();
    registerDetailsViewHeaderActionsProcessor.mockClear();
    registerPluginSettings.mockClear();
  });

  it('registers the pod header action and plugin settings', async () => {
    await import('../src/index');

    expect(registerDetailsViewHeaderActionsProcessor).toHaveBeenCalledTimes(1);
    expect(registerPluginSettings).toHaveBeenCalledWith('headlamp-dotnet-monitor', expect.any(Function), true);
    expect(registerAppBarAction).toHaveBeenCalledTimes(1);
  });
});
