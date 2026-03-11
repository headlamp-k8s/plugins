import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka, KafkaUser } from '../resources';
import type { CreateKafkaUserPayload, KafkaUserInterface } from '../resources';
import { useThemeColors } from '../utils/theme';
import { getErrorMessage } from '../utils/errors';
import { SecureSecretDisplay } from './SecureSecretDisplay';
import { Toast, ToastMessage } from './Toast';

interface ACL {
  resource: {
    type: string;
    name: string;
    patternType: string;
  };
  operations: string[];
  host: string;
}

interface UserFormData {
  name: string;
  namespace: string;
  cluster: string;
  authenticationType: 'tls' | 'scram-sha-512';
  authorizationType: 'simple' | 'none';
  acls: ACL[];
}

export function KafkaUserList() {
  const theme = useTheme();
  const { items: kafkaClusters } = Kafka.useList({});
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
        apiVersion: 'kafka.strimzi.io/v1beta2',
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
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${formData.namespace}/kafkausers`,
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
        cluster: availableClusterNames.length > 0 ? availableClusterNames[0] : '',
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
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${deletingUser.metadata.namespace}/kafkausers/${deletingUser.metadata.name}`,
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

  const addACL = () => {
    setFormData({
      ...formData,
      acls: [
        ...formData.acls,
        {
          resource: {
            type: 'topic',
            name: '*',
            patternType: 'literal',
          },
          operations: ['Read'],
          host: '*',
        },
      ],
    });
  };

  const removeACL = (index: number) => {
    setFormData({
      ...formData,
      acls: formData.acls.filter((_, i) => i !== index),
    });
  };

  const updateACL = (index: number, field: string, value: string | string[]) => {
    const newACLs = [...formData.acls];
    if (field.startsWith('resource.')) {
      const resourceField = field.split('.')[1];
      newACLs[index] = {
        ...newACLs[index],
        resource: {
          ...newACLs[index].resource,
          [resourceField]: value,
        },
      };
    } else if (field === 'operations') {
      newACLs[index] = {
        ...newACLs[index],
        operations: value as string[],
      };
    } else {
      newACLs[index] = {
        ...newACLs[index],
        [field]: value,
      };
    }
    setFormData({ ...formData, acls: newACLs });
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

  const renderCreateDialog = () => {
    if (!showCreateDialog) return null;

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
            minWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <h2 style={{ color: colors.text }}>Create New User</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
            <input
              type="text"
              value={formData.name}
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authentication Type</label>
            <select
              value={formData.authenticationType}
              onChange={e => setFormData({ ...formData, authenticationType: e.target.value as 'tls' | 'scram-sha-512' })}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
              }}
            >
              <option value="scram-sha-512">SCRAM-SHA-512</option>
              <option value="tls">TLS</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authorization Type</label>
            <select
              value={formData.authorizationType}
              onChange={e => setFormData({ ...formData, authorizationType: e.target.value as 'simple' | 'none' })}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
              }}
            >
              <option value="simple">Simple</option>
              <option value="none">None</option>
            </select>
          </div>

          {formData.authorizationType === 'simple' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: 'bold', color: colors.text }}>ACLs</label>
                <button
                  type="button"
                  onClick={addACL}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  + Add ACL
                </button>
              </div>

              {formData.acls.map((acl, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    backgroundColor: colors.inputBg,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: colors.text }}>ACL {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => removeACL(index)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Resource Type</label>
                      <select
                        value={acl.resource.type}
                        onChange={e => updateACL(index, 'resource.type', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${colors.inputBorder}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      >
                        <option value="topic">Topic</option>
                        <option value="group">Group</option>
                        <option value="cluster">Cluster</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Resource Name</label>
                      <input
                        type="text"
                        value={acl.resource.name}
                        onChange={e => updateACL(index, 'resource.name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${colors.inputBorder}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Pattern Type</label>
                      <select
                        value={acl.resource.patternType}
                        onChange={e => updateACL(index, 'resource.patternType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${colors.inputBorder}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      >
                        <option value="literal">Literal</option>
                        <option value="prefix">Prefix</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Operations (comma-separated)</label>
                      <input
                        type="text"
                        value={acl.operations.join(',')}
                        onChange={e => updateACL(index, 'operations', e.target.value.split(',').map(s => s.trim()))}
                        placeholder="e.g., Read,Write,Describe"
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: `1px solid ${colors.inputBorder}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({
                  name: '',
                  namespace: availableNamespacesForCreate.length > 0 ? availableNamespacesForCreate[0] : '',
                  cluster: availableClusterNames.length > 0 ? availableClusterNames[0] : '',
                  authenticationType: 'scram-sha-512',
                  authorizationType: 'simple',
                  acls: [],
                });
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
              onClick={handleCreate}
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <>
      <ResourceListView
        title="Kafka Users"
        resourceClass={KafkaUser}
        columns={columns}
        headerProps={{
          titleSideActions: [
            <Button key="create" variant="contained" color="primary" size="medium" onClick={openCreateDialog}>
              + Create User
            </Button>,
          ],
        }}
      />
      {renderCreateDialog()}
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
