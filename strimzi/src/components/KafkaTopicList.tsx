// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import React from 'react';
import { useTheme } from '@mui/material/styles';
import { KafkaTopic, K8sListResponse } from '../crds';
import { isTopicReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { SearchFilter, FilterGroup, FilterSelect, FilterNumberRange } from './SearchFilter';
import { useThemeColors } from '../utils/theme';
import { getErrorMessage } from '../utils/errors';
import { Toast, ToastMessage } from './Toast';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Chip } from '@mui/material';

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
  const [topics, setTopics] = React.useState<KafkaTopic[]>([]);
  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<KafkaTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = React.useState<KafkaTopic | null>(null);
  const [formData, setFormData] = React.useState<TopicFormData>({
    name: '',
    namespace: 'kafka',
    cluster: 'my-cluster',
    partitions: 3,
    replicas: 3,
  });
  const [loading, setLoading] = React.useState(false);
  const colors = useThemeColors();

  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [minPartitions, setMinPartitions] = React.useState<number | ''>('');
  const [maxPartitions, setMaxPartitions] = React.useState<number | ''>('');
  const [minReplicas, setMinReplicas] = React.useState<number | ''>('');
  const [maxReplicas, setMaxReplicas] = React.useState<number | ''>('');

  const fetchTopics = React.useCallback(() => {
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkatopics')
      .then((data: K8sListResponse<KafkaTopic>) => {
        setTopics(data.items);
      })
      .catch((err: unknown) => {
        // Handle case when Strimzi CRD is not installed
        const message = getErrorMessage(err);
        if (message === 'Not Found' || message.includes('404')) {
          setToast({
            message: 'Strimzi is not installed in this cluster. Please install the Strimzi operator first.',
            type: 'error',
            duration: 6000
          });
        } else {
          setToast({ message, type: 'error' });
        }
      });
  }, []);

  React.useEffect(() => {
    // Initial fetch
    fetchTopics();

    // Auto-refresh every 5 seconds
    const intervalId = setInterval(() => {
      fetchTopics();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchTopics]);

  // Filter topics based on search and filters
  const filteredTopics = React.useMemo(() => {
    return topics.filter((topic) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        topic.metadata.name.toLowerCase().includes(searchLower) ||
        topic.metadata.namespace.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const ready = isTopicReady(topic);
        if (statusFilter === 'ready' && !ready) return false;
        if (statusFilter === 'not-ready' && ready) return false;
      }

      // Partitions filter
      const partitions = topic.spec.partitions || 0;
      if (minPartitions !== '' && partitions < minPartitions) return false;
      if (maxPartitions !== '' && partitions > maxPartitions) return false;

      // Replicas filter
      const replicas = topic.spec.replicas || 0;
      if (minReplicas !== '' && replicas < minReplicas) return false;
      if (maxReplicas !== '' && replicas > maxReplicas) return false;

      return true;
    });
  }, [topics, searchTerm, statusFilter, minPartitions, maxPartitions, minReplicas, maxReplicas]);

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
        namespace: 'kafka',
        cluster: 'my-cluster',
        partitions: 3,
        replicas: 3,
      });
      setToast({ message: `Topic "${formData.name}" created successfully`, type: 'success' });
      fetchTopics();
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
      fetchTopics();
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to update topic', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (topic: KafkaTopic) => {
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
      fetchTopics();
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

  const openEditDialog = (topic: KafkaTopic) => {
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

  const renderDialog = (isEdit: boolean) => {
    if ((!showCreateDialog && !isEdit) || (!showEditDialog && isEdit)) return null;

    return (
      <div style={{
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
      }}>
        <div style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: '24px',
          borderRadius: '8px',
          minWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h2 style={{ color: colors.text }}>{isEdit ? 'Edit Topic' : 'Create New Topic'}</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
            <input
              type="text"
              value={formData.name}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Namespace</label>
            <input
              type="text"
              value={formData.namespace}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
            <input
              type="text"
              value={formData.cluster}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Partitions</label>
            <input
              type="number"
              value={formData.partitions}
              onChange={(e) => setFormData({ ...formData, partitions: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Replicas</label>
            <input
              type="number"
              value={formData.replicas}
              onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Retention (ms)</label>
            <input
              type="number"
              value={formData.retentionMs || ''}
              placeholder="Optional, e.g., 604800000 (7 days)"
              onChange={(e) => setFormData({ ...formData, retentionMs: e.target.value ? parseInt(e.target.value) : undefined })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Compression Type</label>
            <select
              value={formData.compressionType || ''}
              onChange={(e) => setFormData({ ...formData, compressionType: e.target.value || undefined })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
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
              value={formData.minInSyncReplicas || ''}
              placeholder="Optional, e.g., 2"
              onChange={(e) => setFormData({ ...formData, minInSyncReplicas: e.target.value ? parseInt(e.target.value) : undefined })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                isEdit ? setShowEditDialog(false) : setShowCreateDialog(false);
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Kafka Topics</h1>
          <p style={{ margin: '8px 0 0 0', color: theme.palette.text.secondary }}>Strimzi Kafka topics</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: '',
              namespace: 'kafka',
              cluster: 'my-cluster',
              partitions: 3,
              replicas: 3,
            });
            setShowCreateDialog(true);
          }}
          variant="contained"
          color="primary"
          size="medium"
        >
          + Create Topic
        </Button>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search topics by name or namespace..."
        resultCount={filteredTopics.length}
        totalCount={topics.length}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <FilterGroup label="Status">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'ready', label: 'Ready' },
                { value: 'not-ready', label: 'Not Ready' },
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Partitions">
            <FilterNumberRange
              minValue={minPartitions}
              maxValue={maxPartitions}
              onMinChange={setMinPartitions}
              onMaxChange={setMaxPartitions}
              minPlaceholder="Min partitions"
              maxPlaceholder="Max partitions"
            />
          </FilterGroup>

          <FilterGroup label="Replicas">
            <FilterNumberRange
              minValue={minReplicas}
              maxValue={maxReplicas}
              onMinChange={setMinReplicas}
              onMaxChange={setMaxReplicas}
              minPlaceholder="Min replicas"
              maxPlaceholder="Max replicas"
            />
          </FilterGroup>
        </div>
      </SearchFilter>

      {filteredTopics.length === 0 ? (
        <p style={{ textAlign: 'center', color: theme.palette.text.secondary, padding: '40px' }}>
          {topics.length === 0 ? 'No Kafka topics found' : 'No topics match your search criteria'}
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Partitions</th>
              <th style={{ padding: '12px' }}>Replicas</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTopics.map((topic) => {
              const ready = isTopicReady(topic);

              return (
                <tr key={`${topic.metadata.namespace}/${topic.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{topic.metadata.name}</td>
                  <td style={{ padding: '12px' }}>{topic.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>{topic.spec.partitions || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{topic.spec.replicas || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <Chip
                      label={ready ? 'Ready' : 'Not Ready'}
                      variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
                      size="medium"
                      color={ready ? 'success' : 'warning'}
                      sx={{
                        borderRadius: '4px',
                        ...(theme.palette.mode === 'dark' && ready && {
                          borderColor: '#34d399',
                          color: '#34d399',
                          backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        }),
                        ...(theme.palette.mode === 'dark' && !ready && {
                          borderColor: '#f87171',
                          color: '#f87171',
                          backgroundColor: 'rgba(248, 113, 113, 0.15)',
                        }),
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button
                      onClick={() => openEditDialog(topic)}
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ marginRight: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => openDeleteDialog(topic)}
                      variant="contained"
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {renderDialog(false)}
      {renderDialog(true)}

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Topic</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete topic <strong>{deletingTopic?.metadata.name}</strong>?
            This action cannot be undone.
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
    </div>
  );
}
