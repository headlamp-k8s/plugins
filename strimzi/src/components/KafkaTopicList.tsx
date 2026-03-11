import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka, KafkaTopic } from '../resources';
import type { KafkaTopicInterface } from '../resources';
import { useThemeColors } from '../utils/theme';
import { getErrorMessage } from '../utils/errors';
import { Toast, ToastMessage } from './Toast';

interface TopicFormData {
  name: string;
  namespace: string;
  cluster: string;
  partitions: number;
  replicas: number;
  retentionMs?: number;
  compressionType?: string;
  minInSyncReplicas?: number;
}

export function KafkaTopicList() {
  const theme = useTheme();
  const { items: kafkaClusters } = Kafka.useList({});
  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<KafkaTopicInterface | null>(null);
  const [deletingTopic, setDeletingTopic] = React.useState<KafkaTopicInterface | null>(null);
  const [formData, setFormData] = React.useState<TopicFormData>({
    name: '',
    namespace: '',
    cluster: '',
    partitions: 3,
    replicas: 3,
  });
  const [loading, setLoading] = React.useState(false);
  const colors = useThemeColors();

  const availableNamespacesForCreate = React.useMemo(() => {
    return [...new Set(kafkaClusters.map(k => k.metadata.namespace))].sort();
  }, [kafkaClusters]);

  const availableClusterNames = React.useMemo(() => {
    return kafkaClusters.map(k => k.metadata.name).sort();
  }, [kafkaClusters]);

  const filteredClusterNames = React.useMemo(() => {
    if (!formData.namespace) return [];
    return kafkaClusters
      .filter(k => k.metadata.namespace === formData.namespace)
      .map(k => k.metadata.name)
      .sort();
  }, [kafkaClusters, formData.namespace]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const topicResource = {
        apiVersion: 'kafka.strimzi.io/v1beta2',
        kind: 'KafkaTopic',
        metadata: {
          name: formData.name,
          namespace: formData.namespace,
          labels: {
            'strimzi.io/cluster': formData.cluster,
          },
        },
        spec: {
          partitions: formData.partitions,
          replicas: formData.replicas,
          config: {
            ...(formData.retentionMs && { 'retention.ms': formData.retentionMs.toString() }),
            ...(formData.compressionType && { 'compression.type': formData.compressionType }),
            ...(formData.minInSyncReplicas && { 'min.insync.replicas': formData.minInSyncReplicas.toString() }),
          },
        },
      };

      await ApiProxy.request(
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${formData.namespace}/kafkatopics`,
        {
          method: 'POST',
          body: JSON.stringify(topicResource),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setShowCreateDialog(false);
      setFormData({
        name: '',
        namespace: availableNamespacesForCreate.length > 0 ? availableNamespacesForCreate[0] : '',
        cluster: availableClusterNames.length > 0 ? availableClusterNames[0] : '',
        partitions: 3,
        replicas: 3,
      });
      setToast({ message: `Topic "${formData.name}" created successfully`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to create topic', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingTopic) return;
    setLoading(true);
    try {
      const updatedTopic = {
        ...editingTopic,
        spec: {
          ...editingTopic.spec,
          partitions: formData.partitions,
          replicas: formData.replicas,
          config: {
            ...editingTopic.spec.config,
            ...(formData.retentionMs && { 'retention.ms': formData.retentionMs.toString() }),
            ...(formData.compressionType && { 'compression.type': formData.compressionType }),
            ...(formData.minInSyncReplicas && { 'min.insync.replicas': formData.minInSyncReplicas.toString() }),
          },
        },
      };

      await ApiProxy.request(
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${editingTopic.metadata.namespace}/kafkatopics/${editingTopic.metadata.name}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatedTopic),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setShowEditDialog(false);
      setEditingTopic(null);
      setToast({ message: `Topic "${editingTopic?.metadata.name}" updated successfully`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to update topic', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (topic: KafkaTopicInterface) => {
    setDeletingTopic(topic);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTopic) return;

    setShowDeleteDialog(false);

    try {
      await ApiProxy.request(
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${deletingTopic.metadata.namespace}/kafkatopics/${deletingTopic.metadata.name}`,
        { method: 'DELETE' }
      );
      setToast({ message: `Topic "${deletingTopic.metadata.name}" deleted successfully`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to delete topic', type: 'error' });
    } finally {
      setDeletingTopic(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingTopic(null);
  };

  const openEditDialog = (topic: KafkaTopicInterface) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.metadata.name,
      namespace: topic.metadata.namespace,
      cluster: topic.metadata.labels?.['strimzi.io/cluster'] || 'my-cluster',
      partitions: topic.spec.partitions || 3,
      replicas: topic.spec.replicas || 3,
      retentionMs: topic.spec.config?.['retention.ms'] ? parseInt(topic.spec.config['retention.ms'] as string) : undefined,
      compressionType: topic.spec.config?.['compression.type'] as string | undefined,
      minInSyncReplicas: topic.spec.config?.['min.insync.replicas'] ? parseInt(topic.spec.config['min.insync.replicas'] as string) : undefined,
    });
    setShowEditDialog(true);
  };

  const openCreateDialog = () => {
    const firstNs = availableNamespacesForCreate[0] ?? '';
    const firstCluster =
      firstNs && kafkaClusters.length > 0
        ? kafkaClusters
            .filter(k => k.metadata.namespace === firstNs)
            .map(k => k.metadata.name)
            .sort()[0] ?? ''
        : '';
    setFormData({
      name: '',
      namespace: firstNs,
      cluster: firstCluster,
      partitions: 3,
      replicas: 3,
    });
    setShowCreateDialog(true);
  };

  const renderDialog = (isEdit: boolean) => {
    if ((!showCreateDialog && !isEdit) || (!showEditDialog && isEdit)) return null;

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
            <button
              type="button"
              onClick={() => {
                if (isEdit) setShowEditDialog(false);
                else setShowCreateDialog(false);
                setEditingTopic(null);
              }}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={isEdit ? handleEdit : handleCreate}
              disabled={loading || !formData.name}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                cursor: loading || !formData.name ? 'not-allowed' : 'pointer',
                opacity: loading || !formData.name ? 0.5 : 1,
              }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const columns: (ColumnType | ResourceTableColumn<KafkaTopic>)[] = [
    'name',
    'namespace',
    {
      id: 'partitions',
      label: 'Partitions',
      getValue: (item: KafkaTopic) => item.partitions,
    },
    {
      id: 'replicas',
      label: 'Replicas',
      getValue: (item: KafkaTopic) => item.replicas,
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (item: KafkaTopic) => String(item.readyStatus ?? 'Unknown'),
      render: (item: KafkaTopic) => {
        const ready = item.readyStatus === 'True';
        return (
          <Chip
            label={ready ? 'Ready' : 'Not Ready'}
            variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
            size="medium"
            color={ready ? 'success' : 'warning'}
            sx={{
              borderRadius: '4px',
              ...(theme.palette.mode === 'dark' &&
                ready && {
                  borderColor: '#34d399',
                  color: '#34d399',
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                }),
              ...(theme.palette.mode === 'dark' &&
                !ready && {
                  borderColor: '#f87171',
                  color: '#f87171',
                  backgroundColor: 'rgba(248, 113, 113, 0.15)',
                }),
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      getValue: () => '',
      render: (item: KafkaTopic) => (
        <>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ marginRight: 1 }}
            onClick={() => openEditDialog(item.jsonData)}
          >
            Edit
          </Button>
          <Button size="small" variant="contained" color="error" onClick={() => openDeleteDialog(item.jsonData)}>
            Delete
          </Button>
        </>
      ),
    },
    'age',
  ];

  return (
    <>
      <ResourceListView
        title="Kafka Topics"
        resourceClass={KafkaTopic}
        columns={columns}
        headerProps={{
          titleSideActions: [
            <Button key="create" variant="contained" color="primary" size="medium" onClick={openCreateDialog}>
              + Create Topic
            </Button>,
          ],
        }}
      />
      {renderDialog(false)}
      {renderDialog(true)}
      <Dialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Topic</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete topic <strong>{deletingTopic?.metadata.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
