import React from 'react';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useThemeColors } from '../utils/theme';

/** Form state for creating or editing a KafkaTopic resource. */
export interface TopicFormData {
  /** Topic name (immutable after creation). */
  name: string;
  /** Kubernetes namespace where the topic is created. */
  namespace: string;
  /** Name of the Kafka cluster (strimzi.io/cluster label). */
  cluster: string;
  /** Number of partitions for the topic. */
  partitions: number;
  /** Replication factor for the topic. */
  replicas: number;
  /** Optional retention time in milliseconds (retention.ms). */
  retentionMs?: number;
  /** Optional compression codec (e.g. gzip, snappy, lz4, zstd). */
  compressionType?: string;
  /** Optional minimum number of in-sync replicas (min.insync.replicas). */
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

  const inputSx = {
    width: '100%',
    padding: '8px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  return (
    <Box
      sx={{
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
      <Box
        sx={{
          backgroundColor: colors.background,
          color: colors.text,
          p: 3,
          borderRadius: '8px',
          minWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ color: colors.text, mb: 2 }}>
          {isEdit ? 'Edit Topic' : 'Create New Topic'}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
          <input
            type="text"
            value={formData.name}
            disabled={!!isEdit}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Namespace</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.namespace}
              disabled
              style={inputSx}
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
              style={{ ...inputSx, cursor: 'pointer' }}
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
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.cluster}
              disabled
              style={inputSx}
            />
          ) : (
            <select
              value={formData.cluster}
              onChange={e => setFormData({ ...formData, cluster: e.target.value })}
              style={{ ...inputSx, cursor: 'pointer' }}
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
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Partitions</label>
          <input
            type="number"
            value={formData.partitions}
            min={1}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) setFormData({ ...formData, partitions: val });
            }}
            style={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Replicas</label>
          <input
            type="number"
            value={formData.replicas}
            min={1}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) setFormData({ ...formData, replicas: val });
            }}
            style={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Retention (ms)</label>
          <input
            type="number"
            value={formData.retentionMs ?? ''}
            placeholder="Optional, e.g., 604800000 (7 days)"
            onChange={e => setFormData({ ...formData, retentionMs: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            style={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Compression Type</label>
          <select
            value={formData.compressionType ?? ''}
            onChange={e => setFormData({ ...formData, compressionType: e.target.value || undefined })}
            style={inputSx}
          >
            <option value="">None</option>
            <option value="gzip">gzip</option>
            <option value="snappy">snappy</option>
            <option value="lz4">lz4</option>
            <option value="zstd">zstd</option>
            <option value="producer">producer</option>
          </select>
        </Box>

        <Box sx={{ mb: 3 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Min In-Sync Replicas</label>
          <input
            type="number"
            value={formData.minInSyncReplicas ?? ''}
            placeholder="Optional, e.g., 2"
            onChange={e =>
              setFormData({ ...formData, minInSyncReplicas: e.target.value ? parseInt(e.target.value, 10) : undefined })
            }
            style={inputSx}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading || !formData.name}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
