/**
 * @vitest-environment jsdom
 */
import { vi } from 'vitest';
vi.hoisted(() => {
  globalThis.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as any;
});

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class {
    jsonData: any;
    constructor(json: any) { this.jsonData = json; }
    getName() { return this.jsonData.metadata.name; }
    getNamespace() { return this.jsonData.metadata.namespace; }
  }
}));

import { Backup, BackupKubeObject } from './backup';

describe('Backup KubeObject', () => {
  const mockBackupJson: BackupKubeObject = {
    apiVersion: 'velero.io/v1',
    kind: 'Backup',
    metadata: {
      name: 'test-backup',
      namespace: 'velero',
      uid: '12345',
      resourceVersion: '1',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    spec: {
      storageLocation: 'default',
      ttl: '720h0m0s',
    },
    status: {
      phase: 'Completed',
      completionTimestamp: '2023-01-01T00:05:00Z',
      expiration: '2023-01-31T00:05:00Z',
    },
  };

  let backup: Backup;

  beforeEach(() => {
    backup = new Backup(mockBackupJson);
  });

  it('should correctly parse metadata', () => {
    expect(backup.getName()).toBe('test-backup');
    expect(backup.getNamespace()).toBe('velero');
  });

  it('should correctly parse spec properties', () => {
    expect(backup.storageLocation).toBe('default');
    expect(backup.spec.ttl).toBe('720h0m0s');
  });

  it('should correctly parse status properties', () => {
    expect(backup.phase).toBe('Completed');
    expect(backup.completionTimestamp).toBe('2023-01-01T00:05:00Z');
    expect(backup.expiration).toBe('2023-01-31T00:05:00Z');
  });

  it('should handle missing spec and status gracefully', () => {
    const emptyBackup = new Backup({
      apiVersion: 'velero.io/v1',
      kind: 'Backup',
      metadata: { name: 'empty', uid: 'empty-uid', resourceVersion: '1', namespace: 'default' },
    } as BackupKubeObject);

    expect(emptyBackup.phase).toBe('Unknown');
    expect(emptyBackup.storageLocation).toBe('');
    expect(emptyBackup.completionTimestamp).toBe('');
  });
});
