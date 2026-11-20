import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/configDefaults';
import {
  detectMonitorPort,
  getDotnetMonitorSelection,
  getMonitorBasePath,
  isMonitorContainer,
  podMatchesSelector,
} from '../src/detection/monitorDetection';
import { isLikelyMonitorProcess, pickBestProcess } from '../src/detection/processSelection';

describe('monitor detection', () => {
  it('detects the default dotnet-monitor container', () => {
    expect(isMonitorContainer({ name: 'dotnet-monitor' }, DEFAULT_CONFIG)).toBe(true);
    expect(isMonitorContainer({ name: 'dotnetmonitor' }, DEFAULT_CONFIG)).toBe(true);
  });

  it('detects the monitor port by named port and falls back to configured port', () => {
    expect(
      detectMonitorPort(
        {
          ports: [
            { name: 'http', containerPort: 8080 },
            { name: 'dotnet-monitor', containerPort: 52325 },
          ],
        },
        52323,
      ),
    ).toBe(52325);
    expect(detectMonitorPort({}, 52323)).toBe(52323);
  });

  it('detects monitor ports when none are named', () => {
    expect(
      detectMonitorPort(
        {
          ports: [{ containerPort: 52327 }],
        },
        52323,
      ),
    ).toBe(52327);
  });

  it('builds the pod proxy base path', () => {
    expect(getMonitorBasePath('ns', 'pod', 52323)).toBe('/api/v1/namespaces/ns/pods/pod:52323/proxy');
  });

  it('matches label selectors', () => {
    expect(
      podMatchesSelector(
        {
          metadata: {
            labels: { 'dotnet-monitor': 'true' },
          },
        },
        { ...DEFAULT_CONFIG, podLabelSelector: 'dotnet-monitor=true' },
      ),
    ).toBe(true);
  });

  it('selects application containers only when a monitor sidecar is present', () => {
    const selection = getDotnetMonitorSelection(
      {
        metadata: { name: 'my-api', namespace: 'default' },
        spec: {
          containers: [
            { name: 'api', image: 'mcr.microsoft.com/dotnet/aspnet:9.0' },
            { name: 'dotnet-monitor', image: 'mcr.microsoft.com/dotnet/monitor:9', ports: [{ containerPort: 52323 }] },
          ],
        },
      },
      DEFAULT_CONFIG,
    );

    expect(selection?.monitorPort).toBe(52323);
    expect(selection?.applicationContainers.map((item) => item.name)).toEqual(['api']);
  });

  it('shows a single non-monitor container even without dotnet hints', () => {
    const selection = getDotnetMonitorSelection(
      {
        metadata: { name: 'custom-app', namespace: 'default' },
        spec: {
          containers: [
            { name: 'service', image: 'custom/service:1.0' },
            { name: 'monitor', image: 'mcr.microsoft.com/dotnet/monitor:9', ports: [{ containerPort: 52323 }] },
          ],
        },
      },
      { ...DEFAULT_CONFIG, monitorContainerName: 'monitor' },
    );

    expect(selection?.applicationContainers.map((item) => item.name)).toEqual(['service']);
  });

  it('returns null when no monitor sidecar is present', () => {
    expect(
      getDotnetMonitorSelection(
        {
          metadata: { name: 'custom-app', namespace: 'default' },
          spec: {
            containers: [{ name: 'api', image: 'mcr.microsoft.com/dotnet/aspnet:9.0' }],
          },
        },
        DEFAULT_CONFIG,
      ),
    ).toBeNull();
  });

  it('keeps multiple application containers explicit', () => {
    const selection = getDotnetMonitorSelection(
      {
        metadata: { name: 'multi-app', namespace: 'default' },
        spec: {
          containers: [
            { name: 'api', image: 'mcr.microsoft.com/dotnet/aspnet:9.0' },
            { name: 'worker', image: 'mcr.microsoft.com/dotnet/runtime:9.0' },
            { name: 'dotnet-monitor', image: 'mcr.microsoft.com/dotnet/monitor:9', ports: [{ containerPort: 52323 }] },
          ],
        },
      },
      DEFAULT_CONFIG,
    );

    expect(selection?.applicationContainers.map((item) => item.name)).toEqual(['api', 'worker']);
  });

  it('recognizes monitor-like processes and prefers the matching application process', () => {
    expect(isLikelyMonitorProcess({ pid: 1, name: 'dotnet-monitor', commandLine: 'dotnet-monitor collect' })).toBe(
      true,
    );
    expect(
      pickBestProcess(
        [
          { pid: 1, name: 'dotnet-monitor', commandLine: 'dotnet monitor collect' },
          { pid: 1234, name: 'dotnet', commandLine: 'dotnet MyApi.dll' },
        ],
        'api',
      )?.pid,
    ).toBe(1234);
  });
});
