// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GrafanaButtonPure } from './GrafanaButtonPure';

afterEach(() => {
  cleanup();
});

describe('GrafanaButtonPure', () => {
  it('should handle relative paths with query parameters', () => {
    const dashboard = '/d/myapp?var-namespace=default';
    const grafanaUrl = 'https://grafana.example.com';
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(React.createElement(GrafanaButtonPure, { dashboard, grafanaUrl }));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(openMock).toHaveBeenCalledWith(
      'https://grafana.example.com/d/myapp?var-namespace=default',
      '_blank',
      'noopener,noreferrer'
    );
    openMock.mockRestore();
  });

  it('should handle absolute URLs correctly (same origin)', () => {
    const dashboard = 'https://grafana.example.com/d/other-app';
    const grafanaUrl = 'https://grafana.example.com';
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(React.createElement(GrafanaButtonPure, { dashboard, grafanaUrl }));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(openMock).toHaveBeenCalledWith(
      'https://grafana.example.com/d/other-app',
      '_blank',
      'noopener,noreferrer'
    );
    openMock.mockRestore();
  });

  it('should not render for invalid absolute dashboard (cross-origin)', () => {
    const dashboard = 'https://other-grafana.com/d/other-app';
    const grafanaUrl = 'https://grafana.example.com';

    const { container } = render(React.createElement(GrafanaButtonPure, { dashboard, grafanaUrl }));

    expect(container.firstChild).toBeNull();
  });

  it('should handle trailing slashes', () => {
    const dashboard = 'd/myapp?var-ns=default';
    const grafanaUrl = 'https://grafana.example.com/';
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(React.createElement(GrafanaButtonPure, { dashboard, grafanaUrl }));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(openMock).toHaveBeenCalledWith(
      'https://grafana.example.com/d/myapp?var-ns=default',
      '_blank',
      'noopener,noreferrer'
    );
    openMock.mockRestore();
  });
});
