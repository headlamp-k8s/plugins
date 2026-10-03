import { describe, expect, it, vi } from 'vitest';

const { mockRegisterRoute, mockRegisterSidebarEntry, mockMakeCustomResourceClass } = vi.hoisted(
  () => ({
    mockRegisterRoute: vi.fn(),
    mockRegisterSidebarEntry: vi.fn(),
    mockMakeCustomResourceClass: vi.fn(() => class MockCustomResource {}),
  })
);

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: mockMakeCustomResourceClass,
  default: class MockCRD {},
}));

vi.mock('./NodeReadinessRuleList', () => ({
  default: () => 'MockList',
}));

vi.mock('./NodeReadinessRuleDetails', () => ({
  default: () => 'MockDetails',
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
