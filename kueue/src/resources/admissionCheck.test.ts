import { describe, expect, it } from 'vitest';
import {
  findAdmissionCheckRule,
  findUnreadyAdmissionCheckState,
  renderAdmissionCheckFlavors,
  renderAdmissionCheckStatus,
  renderParametersReference,
} from './admissionCheckFormatters';

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

  it('finds the ClusterQueue rule for an AdmissionCheck', () => {
    const strategy = {
      admissionChecks: [{ name: 'prov-req', onFlavors: ['gpu', 'spot'] }, { name: 'manual' }],
    };

    expect(findAdmissionCheckRule(strategy, 'prov-req')?.onFlavors).toEqual(['gpu', 'spot']);
    expect(findAdmissionCheckRule(strategy, 'manual')).toEqual({ name: 'manual' });
    expect(findAdmissionCheckRule(strategy, 'missing')).toBeUndefined();
    expect(findAdmissionCheckRule(undefined, 'prov-req')).toBeUndefined();
  });

  it('renders the flavors an AdmissionCheck runs on', () => {
    expect(renderAdmissionCheckFlavors(['gpu', 'spot'])).toBe('gpu, spot');
    expect(renderAdmissionCheckFlavors([])).toBe('All flavors');
    expect(renderAdmissionCheckFlavors()).toBe('All flavors');
  });

  it('finds a Workload check state only while the check is not Ready', () => {
    const admissionChecks = [
      { name: 'prov-req', state: 'Pending' as const, message: 'waiting for capacity' },
      { name: 'manual', state: 'Ready' as const },
      { name: 'retry-check', state: 'Retry' as const },
    ];

    expect(findUnreadyAdmissionCheckState(admissionChecks, 'prov-req')?.message).toBe(
      'waiting for capacity'
    );
    expect(findUnreadyAdmissionCheckState(admissionChecks, 'retry-check')?.state).toBe('Retry');
    expect(findUnreadyAdmissionCheckState(admissionChecks, 'manual')).toBeUndefined();
    expect(findUnreadyAdmissionCheckState(admissionChecks, 'missing')).toBeUndefined();
    expect(findUnreadyAdmissionCheckState(undefined, 'prov-req')).toBeUndefined();
  });
});
