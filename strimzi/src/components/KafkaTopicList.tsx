import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka, KafkaV1, KafkaTopic, KafkaTopicV1 } from '../resources';
import type { KafkaTopicInterface } from '../resources';
import { getErrorMessage } from '../utils/errors';
import { useStrimziApiVersions } from '../hooks/useStrimziApiVersions';
import { StrimziNotInstalledMessage } from './StrimziNotInstalledMessage';
import { Toast, ToastMessage } from './Toast';
import { TopicFormModal, type TopicFormData } from './TopicFormModal';

export function KafkaTopicList() {
  const theme = useTheme();
  const { ready, installed, kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaClass = kafkaVersion === 'v1' ? KafkaV1 : Kafka;
  const KafkaTopicClass = kafkaVersion === 'v1' ? KafkaTopicV1 : KafkaTopic;
  const kafkaApiPath = `/apis/kafka.strimzi.io/${kafkaVersion}`;

  // All hooks must be called before any early return (Rules of Hooks).
  const { items: kafkaClusters } = KafkaClass.useList({});
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

  const availableNamespacesForCreate = React.useMemo(() => {
    return [...new Set(kafkaClusters.map(k => k.metadata.namespace))].sort();
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
        apiVersion: 'kafka.strimzi.io/' + kafkaVersion,
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
            ...(formData.retentionMs != null ? { 'retention.ms': formData.retentionMs.toString() } : {}),
            ...(formData.compressionType ? { 'compression.type': formData.compressionType } : {}),
            ...(formData.minInSyncReplicas != null ? { 'min.insync.replicas': formData.minInSyncReplicas.toString() } : {}),
          },
        },
      };

      await ApiProxy.request(
        `${kafkaApiPath}/namespaces/${formData.namespace}/kafkatopics`,
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
        cluster: '',
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
            ...(formData.retentionMs != null ? { 'retention.ms': formData.retentionMs.toString() } : {}),
            ...(formData.compressionType ? { 'compression.type': formData.compressionType } : {}),
            ...(formData.minInSyncReplicas != null ? { 'min.insync.replicas': formData.minInSyncReplicas.toString() } : {}),
          },
        },
      };

      await ApiProxy.request(
        `${kafkaApiPath}/namespaces/${editingTopic.metadata.namespace}/kafkatopics/${editingTopic.metadata.name}`,
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
        `${kafkaApiPath}/namespaces/${deletingTopic.metadata.namespace}/kafkatopics/${deletingTopic.metadata.name}`,
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
        const status = item.readyStatus;
        const label = status === 'True' ? 'Ready' : status == null ? 'Unknown' : 'Not Ready';
        const chipColor = status === 'True' ? 'success' : status == null ? 'default' : 'warning';
        return (
          <Chip
            label={label}
            variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
            size="medium"
            color={chipColor}
            sx={{ borderRadius: '4px' }}
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

  if (ready && !installed) return <StrimziNotInstalledMessage />;

  return (
    <>
      <ResourceListView
        title="Kafka Topics"
        resourceClass={KafkaTopicClass}
        columns={columns}
        headerProps={{
          titleSideActions: [
            <Button key="create" variant="contained" color="primary" size="medium" onClick={openCreateDialog}>
              + Create Topic
            </Button>,
          ],
        }}
      />
      <TopicFormModal
        open={showCreateDialog || showEditDialog}
        isEdit={showEditDialog}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        kafkaClusters={kafkaClusters}
        availableNamespacesForCreate={availableNamespacesForCreate}
        filteredClusterNames={filteredClusterNames}
        onCancel={() => {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setEditingTopic(null);
        }}
        onSubmit={showEditDialog ? handleEdit : handleCreate}
      />
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
