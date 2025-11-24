import React from 'react';
import { KafkaTopic } from '../crds';
import { isTopicReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { SearchFilter, FilterGroup, FilterSelect, FilterNumberRange } from './SearchFilter';

// Helper to get theme-aware colors
const useThemeColors = () => {
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    background: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#e0e0e0' : '#000000',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#404040' : '#ddd',
    inputBg: isDark ? '#2a2a2a' : '#ffffff',
    inputBorder: isDark ? '#505050' : '#ddd',
    overlay: 'rgba(0,0,0,0.5)',
  };
};

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
  const [topics, setTopics] = React.useState<KafkaTopic[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<KafkaTopic | null>(null);
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
      .then((data: any) => {
        if (data && data.items) {
          setTopics(data.items);
        }
      })
      .catch((err: Error) => {
        // Handle case when Strimzi CRD is not installed
        if (err.message === 'Not Found' || err.message.includes('404')) {
          setError('Strimzi is not installed in this cluster. Please install the Strimzi operator first.');
        } else {
          setError(err.message);
        }
      });
  }, []);

  React.useEffect(() => {
    fetchTopics();
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
      fetchTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to create topic');
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
      fetchTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to update topic');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (topic: KafkaTopic) => {
    if (!window.confirm(`Are you sure you want to delete topic "${topic.metadata.name}"?`)) {
      return;
    }

    try {
      await ApiProxy.request(
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${topic.metadata.namespace}/kafkatopics/${topic.metadata.name}`,
        { method: 'DELETE' }
      );
      fetchTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to delete topic');
    }
  };

  const openEditDialog = (topic: KafkaTopic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.metadata.name,
      namespace: topic.metadata.namespace,
      cluster: topic.metadata.labels?.['strimzi.io/cluster'] || 'my-cluster',
      partitions: topic.spec.partitions || 3,
      replicas: topic.spec.replicas || 3,
      retentionMs: topic.spec.config?.['retention.ms'] ? parseInt(topic.spec.config['retention.ms']) : undefined,
      compressionType: topic.spec.config?.['compression.type'] as string | undefined,
      minInSyncReplicas: topic.spec.config?.['min.insync.replicas'] ? parseInt(topic.spec.config['min.insync.replicas']) : undefined,
    });
    setShowEditDialog(true);
  };

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

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
                backgroundColor: '#2196f3',
                color: 'white',
                cursor: loading || !formData.name ? 'not-allowed' : 'pointer',
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
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>Strimzi Kafka topics</p>
        </div>
        <button
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
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          + Create Topic
        </button>
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
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
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
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ready ? '#4caf50' : '#ff9800',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => openEditDialog(topic)}
                      style={{
                        padding: '6px 12px',
                        marginRight: '8px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(topic)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {renderDialog(false)}
      {renderDialog(true)}
    </div>
  );
}
