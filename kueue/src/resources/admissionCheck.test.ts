import {
  renderAdmissionCheckStatus,
  renderControllerName,
  renderParameters,
} from './admissionCheckFormatters';

describe('renderControllerName', () => {
  it('returns a dash when controllerName is missing', () => {
    expect(renderControllerName()).toBe('-');
    expect(renderControllerName('')).toBe('-');
  });

  it('returns the controller name when present', () => {
    expect(renderControllerName('kueue.x-k8s.io/provisioning-request')).toBe(
      'kueue.x-k8s.io/provisioning-request'
    );
  });
});

describe('renderParameters', () => {
  it('returns a dash when parameters are missing', () => {
    expect(renderParameters()).toBe('-');
    expect(renderParameters({})).toBe('-');
  });

  it('renders kind/name when apiGroup is missing', () => {
    expect(renderParameters({ kind: 'ProvisioningRequestConfig', name: 'prov-test-config' })).toBe(
      'ProvisioningRequestConfig/prov-test-config'
    );
  });

  it('renders kind/name with apiGroup when present', () => {
    expect(
      renderParameters({
        apiGroup: 'kueue.x-k8s.io',
        kind: 'ProvisioningRequestConfig',
        name: 'prov-test-config',
      })
    ).toBe('ProvisioningRequestConfig/prov-test-config (kueue.x-k8s.io)');
  });

  it('falls back to Unknown kind when kind is missing but name is present', () => {
    expect(renderParameters({ name: 'prov-test-config' })).toBe('Unknown/prov-test-config');
  });
});

describe('renderAdmissionCheckStatus', () => {
  it('returns Unknown when there is no active condition', () => {
    expect(renderAdmissionCheckStatus()).toBe('Unknown');
  });

  it('returns Active when the condition status is True', () => {
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'True' })).toBe('Active');
  });

  it('returns Inactive when the condition status is False', () => {
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'False' })).toBe('Inactive');
  });

  it('returns Unknown when the condition status is Unknown', () => {
    expect(renderAdmissionCheckStatus({ type: 'Active', status: 'Unknown' })).toBe('Unknown');
  });
});