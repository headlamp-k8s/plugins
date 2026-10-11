import { describe, expect, it } from 'vitest';
import { renderAdmissionCheckStatus, renderParametersReference } from './admissionCheckFormatters';

describe('AdmissionCheck formatters', () => {
  it('derives a readable status from the Active condition', () => {
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'True' })).toBe('Active');
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'False' })).toBe('Inactive');
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'Unknown' })).toBe('Unknown');
    expect(renderAdmissionCheckStatus()).toBe('Unknown');
  });

  it('renders the parameters reference with and without an API group', () => {
    expect(
      renderParametersReference({ apiGroup: 'example.com', kind: 'Widget', name: 'my-widget' })
    ).toBe('example.com/Widget/my-widget');
    expect(renderParametersReference({ apiGroup: '', kind: 'Widget', name: 'my-widget' })).toBe(
      'Widget/my-widget'
    );
    expect(renderParametersReference()).toBe('-');
  });
});
