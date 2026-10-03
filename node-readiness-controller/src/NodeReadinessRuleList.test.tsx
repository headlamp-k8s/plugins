// @vitest-environment jsdom
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NodeReadinessRule } from './index';
import ReadinessRulesPage from './NodeReadinessRuleList';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: vi.fn(() => <div data-testid="resource-list-view">MockList</div>),
  Link: vi.fn(({ children }) => <a href="/">{children}</a>),
  StatusLabel: vi.fn(({ children }) => <span>{children}</span>),
}));

vi.mock('./index', () => ({
  NodeReadinessRule: class MockRule {},
}));

describe('ReadinessRulesPage', () => {
  it('should render ResourceListView with correct props', () => {
    const { getByTestId } = render(<ReadinessRulesPage />);
    
    expect(getByTestId('resource-list-view')).toBeTruthy();
    
    expect(ResourceListView).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Node Readiness Rules',
        resourceClass: NodeReadinessRule,
        id: 'nrc-readiness-rules',
        columns: expect.any(Array),
      }),
      expect.anything()
    );
  });
});
