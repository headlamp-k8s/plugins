import React from 'react';
import { KafkaUser } from '../crds';
import { isUserReady } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { SearchFilter, FilterGroup, FilterSelect } from './SearchFilter';

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
  const [users, setUsers] = React.useState<KafkaUser[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showSecretDialog, setShowSecretDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<KafkaUser | null>(null);
  const [userSecret, setUserSecret] = React.useState<string>('');
  const [formData, setFormData] = React.useState<UserFormData>({
    name: '',
    namespace: 'kafka',
    cluster: 'my-cluster',
    authenticationType: 'scram-sha-512',
    authorizationType: 'simple',
    acls: [],
  });
  const [loading, setLoading] = React.useState(false);
  const colors = useThemeColors();

  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [authTypeFilter, setAuthTypeFilter] = React.useState('all');
  const [hasAclsFilter, setHasAclsFilter] = React.useState('all');

  const fetchUsers = React.useCallback(() => {
    ApiProxy.request('/apis/kafka.strimzi.io/v1beta2/kafkausers')
      .then((data: any) => {
        if (data && data.items) {
          setUsers(data.items);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        user.metadata.name.toLowerCase().includes(searchLower) ||
        user.metadata.namespace.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const ready = isUserReady(user);
        if (statusFilter === 'ready' && !ready) return false;
        if (statusFilter === 'not-ready' && ready) return false;
      }

      // Auth Type filter
      if (authTypeFilter !== 'all') {
        const authType = user.spec.authentication.type;
        if (authTypeFilter === 'scram' && authType !== 'scram-sha-512') return false;
        if (authTypeFilter === 'tls' && authType !== 'tls') return false;
      }

      // Has ACLs filter
      if (hasAclsFilter !== 'all') {
        const hasAcls = user.spec.authorization?.type === 'simple' &&
                        (user.spec.authorization?.acls?.length ?? 0) > 0;
        if (hasAclsFilter === 'yes' && !hasAcls) return false;
        if (hasAclsFilter === 'no' && hasAcls) return false;
      }

      return true;
    });
  }, [users, searchTerm, statusFilter, authTypeFilter, hasAclsFilter]);

  const fetchUserSecret = async (user: KafkaUser) => {
    try {
      setLoading(true);
      const secretName = user.metadata.name;
      const namespace = user.metadata.namespace;

      const secret = await ApiProxy.request(
        `/api/v1/namespaces/${namespace}/secrets/${secretName}`
      );

      if (user.spec.authentication.type === 'scram-sha-512') {
        const password = atob(secret.data.password || '');
        setUserSecret(password);
      } else if (user.spec.authentication.type === 'tls') {
        const cert = atob(secret.data['user.crt'] || '');
        const key = atob(secret.data['user.key'] || '');
        setUserSecret(`Certificate:\n${cert}\n\nPrivate Key:\n${key}`);
      }

      setSelectedUser(user);
      setShowSecretDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user secret');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const userResource: any = {
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
      setFormData({
        name: '',
        namespace: 'kafka',
        cluster: 'my-cluster',
        authenticationType: 'scram-sha-512',
        authorizationType: 'simple',
        acls: [],
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: KafkaUser) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.metadata.name}"?`)) {
      return;
    }

    try {
      await ApiProxy.request(
        `/apis/kafka.strimzi.io/v1beta2/namespaces/${user.metadata.namespace}/kafkausers/${user.metadata.name}`,
        { method: 'DELETE' }
      );
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
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

  const updateACL = (index: number, field: string, value: any) => {
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
        operations: value,
      };
    } else {
      newACLs[index] = {
        ...newACLs[index],
        [field]: value,
      };
    }
    setFormData({ ...formData, acls: newACLs });
  };

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '16px' }}>Error: {error}</div>
        <button onClick={() => setError(null)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Dismiss
        </button>
      </div>
    );
  }

  const renderSecretDialog = () => {
    if (!showSecretDialog || !selectedUser) return null;

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
          minWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h2 style={{ color: colors.text }}>User Credentials: {selectedUser.metadata.name}</h2>
          <p style={{ color: colors.text }}><strong>Authentication:</strong> {selectedUser.spec.authentication.type}</p>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>
              {selectedUser.spec.authentication.type === 'scram-sha-512' ? 'Password' : 'Certificate & Key'}
            </label>
            <textarea
              readOnly
              value={userSecret}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.inputBg,
                color: colors.text,
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowSecretDialog(false);
                setSelectedUser(null);
                setUserSecret('');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateDialog = () => {
    if (!showCreateDialog) return null;

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
          minWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
          <h2 style={{ color: colors.text }}>Create New User</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Namespace</label>
            <input
              type="text"
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
            <input
              type="text"
              value={formData.cluster}
              onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authentication Type</label>
            <select
              value={formData.authenticationType}
              onChange={(e) => setFormData({ ...formData, authenticationType: e.target.value as 'tls' | 'scram-sha-512' })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="scram-sha-512">SCRAM-SHA-512</option>
              <option value="tls">TLS</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authorization Type</label>
            <select
              value={formData.authorizationType}
              onChange={(e) => setFormData({ ...formData, authorizationType: e.target.value as 'simple' | 'none' })}
              style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
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
                <div key={index} style={{ marginBottom: '12px', padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: colors.text }}>ACL {index + 1}</strong>
                    <button
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
                        onChange={(e) => updateACL(index, 'resource.type', e.target.value)}
                        style={{ width: '100%', padding: '4px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', fontSize: '12px', backgroundColor: colors.background, color: colors.text }}
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
                        onChange={(e) => updateACL(index, 'resource.name', e.target.value)}
                        style={{ width: '100%', padding: '4px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', fontSize: '12px', backgroundColor: colors.background, color: colors.text }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Pattern Type</label>
                      <select
                        value={acl.resource.patternType}
                        onChange={(e) => updateACL(index, 'resource.patternType', e.target.value)}
                        style={{ width: '100%', padding: '4px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', fontSize: '12px', backgroundColor: colors.background, color: colors.text }}
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
                        onChange={(e) => updateACL(index, 'operations', e.target.value.split(',').map(s => s.trim()))}
                        placeholder="e.g., Read,Write,Describe"
                        style={{ width: '100%', padding: '4px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', fontSize: '12px', backgroundColor: colors.background, color: colors.text }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({
                  name: '',
                  namespace: 'kafka',
                  cluster: 'my-cluster',
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Kafka Users</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>Strimzi Kafka users</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
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
          + Create User
        </button>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search users by name or namespace..."
        resultCount={filteredUsers.length}
        totalCount={users.length}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
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

          <FilterGroup label="Authentication Type">
            <FilterSelect
              value={authTypeFilter}
              onChange={setAuthTypeFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'scram', label: 'SCRAM-SHA-512' },
                { value: 'tls', label: 'TLS' },
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Has ACLs">
            <FilterSelect
              value={hasAclsFilter}
              onChange={setHasAclsFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </FilterGroup>
        </div>
      </SearchFilter>

      {filteredUsers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          {users.length === 0 ? 'No Kafka users found' : 'No users match your search criteria'}
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Authentication</th>
              <th style={{ padding: '12px' }}>Authorization</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const ready = isUserReady(user);

              return (
                <tr key={`${user.metadata.namespace}/${user.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{user.metadata.name}</td>
                  <td style={{ padding: '12px' }}>{user.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#9c27b0',
                      color: 'white',
                      fontSize: '11px'
                    }}>
                      {user.spec.authentication.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{user.spec.authorization?.type || 'None'}</td>
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
                      onClick={() => fetchUserSecret(user)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        marginRight: '8px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      View Secret
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
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

      {renderCreateDialog()}
      {renderSecretDialog()}
    </div>
  );
}
