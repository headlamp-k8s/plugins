import { describe, expect, it, vi } from 'vitest';

const { mockRegisterRoute, mockRegisterSidebarEntry } = vi.hoisted(() => ({
  mockRegisterRoute: vi.fn(),
  mockRegisterSidebarEntry: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
}));

// Import the index file to trigger the registrations
import './index';

describe('node-readiness-controller plugin', () => {
  it('should register the route', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/nrc-rules',
        name: 'Readiness Rules',
        sidebar: 'nrc-rules-list',
        exact: true,
      })
    );
  });

  it('should register the sidebar entries', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'nrc-plugin',
        label: 'Node Readiness',
        icon: 'mdi:shield-check',
        url: '/nrc-rules',
      })
    );

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'nrc-plugin',
        name: 'nrc-rules-list',
        label: 'Readiness Rules',
        url: '/nrc-rules',
      })
    );
  });
});
