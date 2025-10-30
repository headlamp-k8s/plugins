import React from 'react';
import { KafkaTopic } from '../crds';
import { isTopicReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

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

  const fetchTopics = React.useCallback(() => {
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkatopics')
      .then((data: any) => {
        if (data && data.items) {
          setTopics(data.items);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  React.useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

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
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          minWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h2>{isEdit ? 'Edit Topic' : 'Create New Topic'}</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Namespace</label>
            <input
              type="text"
              value={formData.namespace}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Cluster</label>
            <input
              type="text"
              value={formData.cluster}
              disabled={isEdit}
              onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Partitions</label>
            <input
              type="number"
              value={formData.partitions}
              onChange={(e) => setFormData({ ...formData, partitions: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Replicas</label>
            <input
              type="number"
              value={formData.replicas}
              onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Retention (ms)</label>
            <input
              type="number"
              value={formData.retentionMs || ''}
              placeholder="Optional, e.g., 604800000 (7 days)"
              onChange={(e) => setFormData({ ...formData, retentionMs: e.target.value ? parseInt(e.target.value) : undefined })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Compression Type</label>
            <select
              value={formData.compressionType || ''}
              onChange={(e) => setFormData({ ...formData, compressionType: e.target.value || undefined })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Min In-Sync Replicas</label>
            <input
              type="number"
              value={formData.minInSyncReplicas || ''}
              placeholder="Optional, e.g., 2"
              onChange={(e) => setFormData({ ...formData, minInSyncReplicas: e.target.value ? parseInt(e.target.value) : undefined })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
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

      {topics.length === 0 ? (
        <p>No Kafka topics found</p>
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
            {topics.map((topic) => {
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
