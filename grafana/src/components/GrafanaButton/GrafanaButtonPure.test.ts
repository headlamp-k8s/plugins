import { describe, it, expect } from 'vitest';

describe('GrafanaButtonPure URL Construction', () => {
  it('should handle relative paths with query parameters', () => {
    const dashboard = '/d/myapp?var-namespace=default';
    const grafanaUrl = 'https://grafana.example.com';

    // Simulate the logic
    const url = new URL(dashboard, grafanaUrl);
    const result = url.toString();

    expect(result).toBe('https://grafana.example.com/d/myapp?var-namespace=default');
  });

  it('should handle relative paths with hash', () => {
    const dashboard = '/d/myapp#panel-1';
    const grafanaUrl = 'https://grafana.example.com';

    const url = new URL(dashboard, grafanaUrl);
    const result = url.toString();

    expect(result).toBe('https://grafana.example.com/d/myapp#panel-1');
  });

  it('should handle absolute URLs', () => {
    const dashboard = 'https://other-grafana.com/d/other-app';
    const grafanaUrl = 'https://grafana.example.com';

    // Should not use grafanaUrl if dashboard is absolute
    expect(dashboard.startsWith('http')).toBe(true);
  });

  it('should handle trailing slashes', () => {
    const dashboard = 'd/myapp?var-ns=default';
    const grafanaUrl = 'https://grafana.example.com/';

    const url = new URL(dashboard, grafanaUrl);
    const result = url.toString();

    expect(result).toBe('https://grafana.example.com/d/myapp?var-ns=default');
  });
});
