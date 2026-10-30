import { describe, expect, it } from 'vitest';
import { getCiliumRow, getRelayRow } from './statusRows';

describe('getCiliumRow', () => {
  it('is found when the list has the CRD', () => {
    expect(getCiliumRow([{}], null)).toEqual({
      component: 'Cilium',
      state: 'found',
      details: 'ciliumnetworkpolicies.cilium.io is installed',
    });
  });

  it('is missing when the list comes back empty', () => {
    expect(getCiliumRow([], null)).toEqual({
      component: 'Cilium',
      state: 'missing',
      details: 'ciliumnetworkpolicies.cilium.io is not installed',
    });
  });

  it('is unknown when the list fails, for example without permission to list CRDs', () => {
    expect(getCiliumRow(null, { status: 403 })).toEqual({
      component: 'Cilium',
      state: 'unknown',
      details: "Couldn't check (403)",
    });
    expect(getCiliumRow(null, {}).details).toBe("Couldn't check");
  });

  it('is unknown when a refresh fails, even with the last list still cached', () => {
    // useList keeps returning the previous list next to the error of a failed refresh.
    expect(getCiliumRow([{}], { status: 403 })).toEqual({
      component: 'Cilium',
      state: 'unknown',
      details: "Couldn't check (403)",
    });
  });

  it('is checking while the list loads', () => {
    expect(getCiliumRow(null, null).state).toBe('checking');
  });
});

describe('getRelayRow', () => {
  it('lists the namespaces the hubble-relay Service is in', () => {
    expect(getRelayRow([{ namespace: 'kube-system' }], null)).toEqual({
      component: 'Hubble Relay',
      state: 'found',
      details: 'Service hubble-relay in kube-system',
    });
    expect(
      getRelayRow(
        [{ namespace: 'kube-system' }, { namespace: 'cilium' }, { namespace: 'cilium' }],
        null
      ).details
    ).toBe('Service hubble-relay in cilium, kube-system');
  });

  it('is missing when the list comes back empty', () => {
    expect(getRelayRow([], null)).toEqual({
      component: 'Hubble Relay',
      state: 'missing',
      details: 'No hubble-relay Service. Enable Hubble Relay to see traffic flows.',
    });
  });

  it('is unknown when the list fails, for example without permission to list Services', () => {
    expect(getRelayRow(null, { status: 403 })).toEqual({
      component: 'Hubble Relay',
      state: 'unknown',
      details: "Couldn't check (403)",
    });
  });

  it('is checking while the list loads', () => {
    expect(getRelayRow(null, null).state).toBe('checking');
  });
});
