import { describe, expect, it, vi } from 'vitest';

const { mockRegisterRoute, mockRegisterSidebarEntry } = vi.hoisted(() => ({
  mockRegisterRoute: vi.fn(),
  mockRegisterSidebarEntry: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockReturnValue(class MockCRD {}),
}));

vi.mock('./NodeReadinessRuleDetails', () => ({
  default: () => null,
}));

vi.mock('./NodeReadinessRuleList', () => ({
  default: () => null,
}));

// Import the index file to trigger the registrations
import './index';

describe('node-readiness-controller plugin registration', () => {
  it('should register the list and details routes', () => {
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/nrc/rules',
        name: 'Readiness Rules',
        sidebar: 'nrc-rules-list',
        exact: true,
      })
    );

    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/nrc/rules/:name',
        name: 'nrc-rule-details',
        sidebar: 'nrc-rules-list',
        exact: true,
      })
    );
  });

  it('should register both sidebar entries', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'nrc-plugin',
        label: 'Node Readiness',
        icon: 'mdi:shield-check',
        url: '/nrc/rules',
      })
    );

    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'nrc-plugin',
        name: 'nrc-rules-list',
        label: 'Readiness Rules',
        url: '/nrc/rules',
      })
    );
  });
});
