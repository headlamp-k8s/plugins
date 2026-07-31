import { describe, expect, it } from 'vitest';
import { getNodeId, getResolvedValues, getSubResourceHealth } from './subResources';

describe('getSubResourceHealth', () => {
  it('reports Deployment readiness against desired replicas', () => {
    expect(
      getSubResourceHealth('Deployment', { spec: { replicas: 2 }, status: { readyReplicas: 2 } })
    ).toEqual({ status: 'success', label: '2/2 ready' });
    expect(
      getSubResourceHealth('Deployment', { spec: { replicas: 2 }, status: { readyReplicas: 1 } })
    ).toEqual({ status: 'error', label: '1/2 ready' });
    // Scaled to zero (e.g. an unapproved kro gate) is not healthy.
    expect(getSubResourceHealth('Deployment', { spec: { replicas: 0 }, status: {} })).toEqual({
      status: 'error',
      label: '0/0 ready',
    });
  });

  it('maps PVC phases', () => {
    expect(getSubResourceHealth('PersistentVolumeClaim', { status: { phase: 'Bound' } })).toEqual({
      status: 'success',
      label: 'Bound',
    });
    expect(
      getSubResourceHealth('PersistentVolumeClaim', { status: { phase: 'Pending' } }).status
    ).toBe('warning');
    expect(
      getSubResourceHealth('PersistentVolumeClaim', { status: { phase: 'Lost' } }).status
    ).toBe('error');
  });

  it('reports Job outcomes', () => {
    expect(getSubResourceHealth('Job', { status: { succeeded: 1 } }).status).toBe('success');
    expect(getSubResourceHealth('Job', { status: { failed: 2 } }).label).toBe('Failed (2)');
    expect(getSubResourceHealth('Job', { status: { active: 1 } }).label).toBe('Running');
  });

  it('uses a Ready condition when present, else "Created", and never throws on junk', () => {
    expect(
      getSubResourceHealth('Widget', {
        status: { conditions: [{ type: 'Ready', status: 'True' }] },
      })
    ).toEqual({ status: 'success', label: 'Ready' });
    expect(getSubResourceHealth('ConfigMap', {})).toEqual({ status: 'success', label: 'Created' });
    expect(getSubResourceHealth('Widget', null).label).toBe('Created');
    expect(getSubResourceHealth('Widget', { status: { conditions: 'junk' } }).label).toBe(
      'Created'
    );
  });
});

describe('getResolvedValues', () => {
  it('surfaces the PVC storageClass — the demo portability proof — and capacity', () => {
    expect(
      getResolvedValues('PersistentVolumeClaim', {
        spec: { storageClassName: 'gp3' },
        status: { capacity: { storage: '8Gi' } },
      })
    ).toBe('storageClass: gp3, capacity: 8Gi');
    expect(getResolvedValues('PersistentVolumeClaim', { spec: {} })).toBe(
      'storageClass: (cluster default)'
    );
  });

  it('surfaces Deployment replicas and Service type/clusterIP', () => {
    expect(
      getResolvedValues('Deployment', { spec: { replicas: 2 }, status: { readyReplicas: 2 } })
    ).toBe('replicas: 2/2');
    expect(
      getResolvedValues('Service', { spec: { type: 'ClusterIP', clusterIP: '10.0.0.1' } })
    ).toBe('type: ClusterIP, clusterIP: 10.0.0.1');
    expect(getResolvedValues('Service', { spec: { clusterIP: 'None' } })).toBe('type: ClusterIP');
  });

  it('returns empty for kinds without resolved values', () => {
    expect(getResolvedValues('ServiceAccount', {})).toBe('');
  });
});

describe('getNodeId', () => {
  it('reads the kro.run/node-id label with a fallback', () => {
    expect(getNodeId({ metadata: { labels: { 'kro.run/node-id': 'cache' } } })).toBe('cache');
    expect(getNodeId({ metadata: {} })).toBe('-');
    expect(getNodeId(null)).toBe('-');
  });
});
