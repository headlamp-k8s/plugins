import React from 'react';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useThemeColors } from '../utils/theme';

/** Single ACL rule attached to a KafkaUser. */
export interface UserFormAcl {
  /** Target resource (topic, group, or cluster). */
  resource: {
    /** Resource type: topic, group, or cluster. */
    type: string;
    /** Resource name or wildcard ('*'). */
    name: string;
    /** Pattern type: literal or prefix. */
    patternType: string;
  };
  /** Kafka operations granted by this rule (e.g. Read, Write, Describe). */
  operations: string[];
  /** Host from which operations are allowed ('*' for any). */
  host: string;
}

/** Form state for creating a KafkaUser resource. */
export interface UserFormData {
  /** User name (becomes metadata.name). */
  name: string;
  /** Kubernetes namespace where the user is created. */
  namespace: string;
  /** Name of the Kafka cluster (strimzi.io/cluster label). */
  cluster: string;
  /** Authentication mechanism: TLS mutual auth or SCRAM-SHA-512. */
  authenticationType: 'tls' | 'scram-sha-512';
  /** Authorization type: simple (ACL-based) or none. */
  authorizationType: 'simple' | 'none';
  /** ACL rules (only used when authorizationType is 'simple'). */
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

  const inputSx = {
    width: '100%',
    padding: '8px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  const smallInputSx = {
    width: '100%',
    padding: '4px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: colors.background,
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
          minWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ color: colors.text, mb: 2 }}>
          Create New User
        </Typography>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
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
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Cluster</label>
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
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authentication Type</label>
          <select
            value={formData.authenticationType}
            onChange={e => setFormData({ ...formData, authenticationType: e.target.value as 'tls' | 'scram-sha-512' })}
            style={inputSx}
          >
            <option value="scram-sha-512">SCRAM-SHA-512</option>
            <option value="tls">TLS</option>
          </select>
        </Box>

        <Box sx={{ mb: 2 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: colors.text }}>Authorization Type</label>
          <select
            value={formData.authorizationType}
            onChange={e => setFormData({ ...formData, authorizationType: e.target.value as 'simple' | 'none' })}
            style={inputSx}
          >
            <option value="simple">Simple</option>
            <option value="none">None</option>
          </select>
        </Box>

        {formData.authorizationType === 'simple' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <label style={{ fontWeight: 'bold', color: colors.text }}>ACLs</label>
              <Button variant="contained" size="small" color="success" onClick={addACL}>
                + Add ACL
              </Button>
            </Box>

            {formData.acls.map((acl, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.inputBg,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <strong style={{ color: colors.text }}>ACL {index + 1}</strong>
                  <Button variant="contained" size="small" color="error" onClick={() => removeACL(index)}>
                    Remove
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Resource Type</label>
                    <select
                      value={acl.resource.type}
                      onChange={e => updateACL(index, 'resource.type', e.target.value)}
                      style={smallInputSx}
                    >
                      <option value="topic">Topic</option>
                      <option value="group">Group</option>
                      <option value="cluster">Cluster</option>
                    </select>
                  </Box>

                  <Box>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Resource Name</label>
                    <input
                      type="text"
                      value={acl.resource.name}
                      onChange={e => updateACL(index, 'resource.name', e.target.value)}
                      style={smallInputSx}
                    />
                  </Box>

                  <Box>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Pattern Type</label>
                    <select
                      value={acl.resource.patternType}
                      onChange={e => updateACL(index, 'resource.patternType', e.target.value)}
                      style={smallInputSx}
                    >
                      <option value="literal">Literal</option>
                      <option value="prefix">Prefix</option>
                    </select>
                  </Box>

                  <Box>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: colors.text }}>Operations (comma-separated)</label>
                    <input
                      type="text"
                      value={acl.operations.join(',')}
                      onChange={e => updateACL(index, 'operations', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="e.g., Read,Write,Describe"
                      style={smallInputSx}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading || !formData.name}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
