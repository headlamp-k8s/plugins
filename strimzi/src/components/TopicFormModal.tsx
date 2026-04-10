import React from 'react';
import { Button } from '@mui/material';
import { useThemeColors } from '../utils/theme';

export interface TopicFormData {
  name: string;
  namespace: string;
  cluster: string;
  partitions: number;
  replicas: number;
  retentionMs?: number;
  compressionType?: string;
  minInSyncReplicas?: number;
}

export type KafkaClusterRef = { metadata: { namespace?: string; name: string } };

export interface TopicFormModalProps {
  open: boolean;
  isEdit: boolean;
  loading: boolean;
  formData: TopicFormData;
  setFormData: React.Dispatch<React.SetStateAction<TopicFormData>>;
  kafkaClusters: KafkaClusterRef[];
  availableNamespacesForCreate: string[];
  filteredClusterNames: string[];
  onCancel: () => void;
  onSubmit: () => void;
}

export function TopicFormModal({
  open,
  isEdit,
  loading,
  formData,
  setFormData,
  kafkaClusters,
  availableNamespacesForCreate,
  filteredClusterNames,
  onCancel,
  onSubmit,
}: TopicFormModalProps) {
  const colors = useThemeColors();

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: '24px',
          borderRadius: '8px',
          minWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: colors.text }}>{isEdit ? 'Edit Topic' : 'Create New Topic'}</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
          <input
            type="text"
            value={formData.name}
            disabled={!!isEdit}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Namespace</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.namespace}
              disabled
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
              }}
            />
          ) : (
            <select
              value={formData.namespace}
              onChange={e => {
                const newNamespace = e.target.value;
                const clustersInNamespace = kafkaClusters
                  .filter(k => k.metadata.namespace === newNamespace)
                  .map(k => k.metadata.name)
                  .sort();
                setFormData({
                  ...formData,
                  namespace: newNamespace,
                  cluster: clustersInNamespace.length > 0 ? clustersInNamespace[0] : '',
                });
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
                cursor: 'pointer',
              }}
            >
              {availableNamespacesForCreate.length === 0 ? (
                <option value="">No namespaces available</option>
              ) : (
                availableNamespacesForCreate.map(ns => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.cluster}
              disabled
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
              }}
            />
          ) : (
            <select
              value={formData.cluster}
              onChange={e => setFormData({ ...formData, cluster: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
                cursor: 'pointer',
              }}
            >
              {filteredClusterNames.length === 0 ? (
                <option value="">No clusters available in this namespace</option>
              ) : (
                filteredClusterNames.map(cluster => (
                  <option key={cluster} value={cluster}>
                    {cluster}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Partitions</label>
          <input
            type="number"
            value={formData.partitions}
            onChange={e => setFormData({ ...formData, partitions: parseInt(e.target.value, 10) })}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Replicas</label>
          <input
            type="number"
            value={formData.replicas}
            onChange={e => setFormData({ ...formData, replicas: parseInt(e.target.value, 10) })}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Retention (ms)</label>
          <input
            type="number"
            value={formData.retentionMs ?? ''}
            placeholder="Optional, e.g., 604800000 (7 days)"
            onChange={e => setFormData({ ...formData, retentionMs: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Compression Type</label>
          <select
            value={formData.compressionType ?? ''}
            onChange={e => setFormData({ ...formData, compressionType: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          >
            <option value="">None</option>
            <option value="gzip">gzip</option>
            <option value="snappy">snappy</option>
            <option value="lz4">lz4</option>
            <option value="zstd">zstd</option>
            <option value="producer">producer</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Min In-Sync Replicas</label>
          <input
            type="number"
            value={formData.minInSyncReplicas ?? ''}
            placeholder="Optional, e.g., 2"
            onChange={e =>
              setFormData({ ...formData, minInSyncReplicas: e.target.value ? parseInt(e.target.value, 10) : undefined })
            }
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '4px',
              backgroundColor: colors.inputBg,
              color: colors.text,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading || !formData.name}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
