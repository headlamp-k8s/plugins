/**
 * Tests for kmeshDaemonApi.ts
 * - KMESH_DAEMON_PORT constant
 * - buildDaemonProxyPath path construction
 * - buildDefaultDaemonProxyPath convenience wrapper
 */
import { describe, expect, it } from 'vitest';
import {
  buildDaemonProxyPath,
  buildDefaultDaemonProxyPath,
  DAEMON_ENDPOINTS,
  KMESH_DAEMON_PORT,
  KMESH_NAMESPACE,
} from './kmeshDaemonApi';

describe('kmeshDaemonApi constants', () => {
  it('should export port 15200', () => {
    expect(KMESH_DAEMON_PORT).toBe(15200);
  });

  it('should export default namespace', () => {
    expect(KMESH_NAMESPACE).toBe('kmesh-system');
  });

  it('should export all expected endpoints', () => {
    expect(DAEMON_ENDPOINTS.VERSION).toBe('/version');
    expect(DAEMON_ENDPOINTS.READY).toBe('/debug/ready');
    expect(DAEMON_ENDPOINTS.LOGGERS).toBe('/debug/loggers');
    expect(DAEMON_ENDPOINTS.CONFIG_DUMP_ADS).toBe('/debug/config_dump/kernel-native');
    expect(DAEMON_ENDPOINTS.CONFIG_DUMP_WORKLOAD).toBe('/debug/config_dump/dual-engine');
    expect(DAEMON_ENDPOINTS.BPF_ADS_MAPS).toBe('/debug/config_dump/bpf/kernel-native');
    expect(DAEMON_ENDPOINTS.BPF_WORKLOAD_MAPS).toBe('/debug/config_dump/bpf/dual-engine');
    expect(DAEMON_ENDPOINTS.ACCESSLOG).toBe('/accesslog');
    expect(DAEMON_ENDPOINTS.MONITORING).toBe('/monitoring');
    expect(DAEMON_ENDPOINTS.WORKLOAD_METRICS).toBe('/workload_metrics');
    expect(DAEMON_ENDPOINTS.CONNECTION_METRICS).toBe('/connection_metrics');
    expect(DAEMON_ENDPOINTS.AUTHZ).toBe('/authz');
  });
});

describe('buildDaemonProxyPath', () => {
  const NS = 'kmesh-system';
  const POD = 'kmesh-daemon-abc12';

  it('should build the correct pod-proxy path for /version', () => {
    const path = buildDaemonProxyPath(NS, POD, DAEMON_ENDPOINTS.VERSION);
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/version`
    );
  });

  it('should build the correct path for /debug/ready', () => {
    const path = buildDaemonProxyPath(NS, POD, DAEMON_ENDPOINTS.READY);
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/debug/ready`
    );
  });

  it('should build the correct path for /debug/config_dump/dual-engine', () => {
    const path = buildDaemonProxyPath(NS, POD, DAEMON_ENDPOINTS.CONFIG_DUMP_WORKLOAD);
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/debug/config_dump/dual-engine`
    );
  });

  it('should append query params for toggle endpoints', () => {
    const path = buildDaemonProxyPath(NS, POD, DAEMON_ENDPOINTS.ACCESSLOG, {
      enable: 'true',
    });
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/accesslog?enable=true`
    );
  });

  it('should handle multiple query params', () => {
    const path = buildDaemonProxyPath(NS, POD, DAEMON_ENDPOINTS.LOGGERS, {
      name: 'bpf',
    });
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/debug/loggers?name=bpf`
    );
  });

  it('should support a custom namespace', () => {
    const path = buildDaemonProxyPath('custom-ns', POD, DAEMON_ENDPOINTS.VERSION);
    expect(path).toBe(`/api/v1/namespaces/custom-ns/pods/kmesh-daemon-abc12:15200/proxy/version`);
  });
});

describe('buildDefaultDaemonProxyPath', () => {
  it('should use KMESH_NAMESPACE automatically', () => {
    const path = buildDefaultDaemonProxyPath('kmesh-daemon-abc12', DAEMON_ENDPOINTS.READY);
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/debug/ready`
    );
  });

  it('should pass query params through', () => {
    const path = buildDefaultDaemonProxyPath('kmesh-daemon-abc12', DAEMON_ENDPOINTS.MONITORING, {
      enable: 'false',
    });
    expect(path).toBe(
      `/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/monitoring?enable=false`
    );
  });
});
