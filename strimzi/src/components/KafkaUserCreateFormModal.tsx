import React from 'react';
import { Button } from '@mui/material';
import { useThemeColors } from '../utils/theme';

export interface UserFormAcl {
  resource: {
    type: string;
    name: string;
    patternType: string;
  };
  operations: string[];
  host: string;
}

export interface UserFormData {
  name: string;
  namespace: string;
  cluster: string;
  authenticationType: 'tls' | 'scram-sha-512';
  authorizationType: 'simple' | 'none';
  acls: UserFormAcl[];
}

export type KafkaClusterRef = { metadata: { namespace?: string; name: string } };

export interface KafkaUserCreateFormModalProps {
  open: boolean;
  loading: boolean;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  kafkaClusters: KafkaClusterRef[];
  availableNamespacesForCreate: string[];
  filteredClusterNames: string[];
  onCancel: () => void;
  onSubmit: () => void;
}

export function KafkaUserCreateFormModal({
  open,
  loading,
  formData,
  setFormData,
  kafkaClusters,
  availableNamespacesForCreate,
  filteredClusterNames,
  onCancel,
  onSubmit,
}: KafkaUserCreateFormModalProps) {
  const colors = useThemeColors();

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
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading || !formData.name}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
