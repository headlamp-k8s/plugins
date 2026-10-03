// @vitest-environment jsdom
import { Resource } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NodeReadinessRule } from './index';
import NodeReadinessRuleDetails from './NodeReadinessRuleDetails';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'test-rule' }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Resource: {
    DetailsGrid: vi.fn(() => <div data-testid="details-grid">MockDetails</div>),
  },
  SimpleTable: vi.fn(() => <table></table>),
}));

vi.mock('./index', () => ({
  NodeReadinessRule: class MockRule {},
}));

describe('NodeReadinessRuleDetails', () => {
  it('should render DetailsGrid with correct props', () => {
    const { getByTestId } = render(<NodeReadinessRuleDetails />);
    
    expect(getByTestId('details-grid')).toBeTruthy();
    
    expect(Resource.DetailsGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: NodeReadinessRule,
        name: 'test-rule',
        withEvents: true,
      }),
      expect.anything()
    );
  });
});
