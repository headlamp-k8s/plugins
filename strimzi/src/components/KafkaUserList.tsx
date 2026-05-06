import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka, KafkaV1, KafkaUser, KafkaUserV1 } from '../resources';
import type { CreateKafkaUserPayload, KafkaUserInterface } from '../resources';
import { getErrorMessage } from '../utils/errors';
import { useStrimziApiVersions } from '../hooks/useStrimziApiVersions';
import { StrimziNotInstalledMessage } from './StrimziNotInstalledMessage';
import { SecureSecretDisplay } from './SecureSecretDisplay';
import { Toast, ToastMessage } from './Toast';
import { KafkaUserCreateFormModal, type UserFormData } from './KafkaUserCreateFormModal';

export function KafkaUserList() {
  const theme = useTheme();
  const { ready, installed, kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaClass = kafkaVersion === 'v1' ? KafkaV1 : Kafka;
  const KafkaUserClass = kafkaVersion === 'v1' ? KafkaUserV1 : KafkaUser;
  const kafkaApiPath = `/apis/kafka.strimzi.io/${kafkaVersion}`;

  // All hooks must be called before any early return (Rules of Hooks).
  const { items: kafkaClusters } = KafkaClass.useList({});
  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showSecretDialog, setShowSecretDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<KafkaUserInterface | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<KafkaUserInterface | null>(null);
  const [userSecret, setUserSecret] = React.useState<string>('');
  const [formData, setFormData] = React.useState<UserFormData>({
    name: '',
    namespace: '',
    cluster: '',
    authenticationType: 'scram-sha-512',
    authorizationType: 'simple',
    acls: [],
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

  const fetchUserSecret = async (user: KafkaUserInterface) => {
    try {
      setLoading(true);
      const secretName = user.metadata.name;
      const namespace = user.metadata.namespace;

      const secret = await ApiProxy.request(`/api/v1/namespaces/${namespace}/secrets/${secretName}`);

      try {
        if (user.spec.authentication.type === 'scram-sha-512') {
          const password = atob(secret.data.password || '');
          setUserSecret(password);
        } else if (user.spec.authentication.type === 'tls') {
          const cert = atob(secret.data['user.crt'] || '');
          const key = atob(secret.data['user.key'] || '');
          setUserSecret(`Certificate:\n${cert}\n\nPrivate Key:\n${key}`);
        }
      } catch {
        setUserSecret('Failed to decode secret data');
      }

      setSelectedUser(user);
      setShowSecretDialog(true);
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to fetch user secret', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const userResource: CreateKafkaUserPayload = {
        apiVersion: `kafka.strimzi.io/${kafkaVersion}`,
        kind: 'KafkaUser',
        metadata: {
          name: formData.name,
          namespace: formData.namespace,
          labels: {
            'strimzi.io/cluster': formData.cluster,
          },
        },
        spec: {
          authentication: {
            type: formData.authenticationType,
          },
        },
      };

      if (formData.authorizationType !== 'none') {
        userResource.spec.authorization = {
          type: formData.authorizationType,
          acls: formData.acls,
        };
      }

      await ApiProxy.request(
        `${kafkaApiPath}/namespaces/${formData.namespace}/kafkausers`,
        {
          method: 'POST',
          body: JSON.stringify(userResource),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setShowCreateDialog(false);
      const userName = formData.name;
      setFormData({
        name: '',
        namespace: availableNamespacesForCreate.length > 0 ? availableNamespacesForCreate[0] : '',
        cluster: '',
        authenticationType: 'scram-sha-512',
        authorizationType: 'simple',
        acls: [],
      });
      setToast({ message: `User "${userName}" created successfully`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to create user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (user: KafkaUserInterface) => {
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setShowDeleteDialog(false);

    try {
      await ApiProxy.request(
        `${kafkaApiPath}/namespaces/${deletingUser.metadata.namespace}/kafkausers/${deletingUser.metadata.name}`,
        { method: 'DELETE' }
      );
      setToast({ message: `User "${deletingUser.metadata.name}" deleted successfully`, type: 'success' });
    } catch (err: unknown) {
      setToast({ message: getErrorMessage(err) || 'Failed to delete user', type: 'error' });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingUser(null);
  };

  const handleCloseSecretDialog = () => {
    setShowSecretDialog(false);
    setSelectedUser(null);
    setUserSecret('');
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
      authenticationType: 'scram-sha-512',
      authorizationType: 'simple',
      acls: [],
    });
    setShowCreateDialog(true);
  };

  const resetUserForm = () =>
    setFormData({
      name: '',
      namespace: availableNamespacesForCreate.length > 0 ? availableNamespacesForCreate[0] : '',
      cluster: '',
      authenticationType: 'scram-sha-512',
      authorizationType: 'simple',
      acls: [],
    });

  const columns: (ColumnType | ResourceTableColumn<KafkaUser>)[] = [
    'name',
    'namespace',
    {
      id: 'authentication',
      label: 'Authentication',
      getValue: (item: KafkaUser) => item.authenticationType,
      render: (item: KafkaUser) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#9c27b0',
            color: 'white',
            fontSize: '11px',
          }}
        >
          {item.authenticationType}
        </span>
      ),
    },
    {
      id: 'authorization',
      label: 'Authorization',
      getValue: (item: KafkaUser) => item.authorizationType,
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (item: KafkaUser) => String(item.readyStatus ?? 'Unknown'),
      render: (item: KafkaUser) => {
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
      render: (item: KafkaUser) => (
        <>
          <Button
            size="small"
            variant="contained"
            color="warning"
            disabled={loading}
            sx={{ marginRight: 1 }}
            onClick={() => fetchUserSecret(item.jsonData)}
          >
            View Secret
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
        title="Kafka Users"
        resourceClass={KafkaUserClass}
        columns={columns}
        headerProps={{
          titleSideActions: [
            <Button key="create" variant="contained" color="primary" size="medium" onClick={openCreateDialog}>
              + Create User
            </Button>,
          ],
        }}
      />
      <KafkaUserCreateFormModal
        open={showCreateDialog}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        kafkaClusters={kafkaClusters}
        availableNamespacesForCreate={availableNamespacesForCreate}
        filteredClusterNames={filteredClusterNames}
        onCancel={() => {
          setShowCreateDialog(false);
          resetUserForm();
        }}
        onSubmit={handleCreate}
      />
      <SecureSecretDisplay
        secretValue={userSecret}
        secretType={selectedUser?.spec.authentication.type === 'scram-sha-512' ? 'password' : 'certificate'}
        resourceName={selectedUser?.metadata.name || ''}
        isOpen={showSecretDialog}
        onClose={handleCloseSecretDialog}
      />
      <Dialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete user <strong>{deletingUser?.metadata.name}</strong>? This action cannot be undone.
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
