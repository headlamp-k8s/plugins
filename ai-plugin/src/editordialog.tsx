import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ConfirmDialog, Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import Editor from '@monaco-editor/react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import YAML from 'yaml';

type EditorDialogProps = {
  open: boolean;
  onClose: () => void;
  yamlContent: string;
  title: string;
  resourceType?: string;
  isDelete?: boolean;
  onSuccess?: (response: any) => void;
};

export default function EditorDialog({
  open,
  onClose,
  yamlContent,
  title,
  resourceType = 'Resource',
  isDelete = false,
  onSuccess,
}: EditorDialogProps) {
  const [content, setContent] = useState(yamlContent);
  const [resourceName, setResourceName] = useState('');
  const [resourceNamespace, setResourceNamespace] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const themeName = localStorage.getItem('headlampThemePreference');

  useEffect(() => {
    // Extract name and namespace from YAML content
    try {
      if (yamlContent) {
        const parsed = YAML.parse(yamlContent);
        if (parsed && parsed.metadata) {
          if (parsed.metadata.name) {
            setResourceName(parsed.metadata.name);
          }
          if (parsed.metadata.namespace) {
            setResourceNamespace(parsed.metadata.namespace);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing YAML for resource details:', error);
    }
  }, [yamlContent]);

  useEffect(() => {
    setContent(yamlContent);
  }, [yamlContent]);

  const handleApply = () => {
    try {
      const cluster = getCluster();
      if (!cluster) {
        throw new Error('No cluster selected');
      }

      // Parse YAML to JSON
      const resource = YAML.parse(content);
      if (!resource) {
        throw new Error('Invalid YAML content');
      }

      clusterAction(
        async () => {
          const response = await apply(resource, cluster);
          if (onSuccess) {
            onSuccess(response);
          }
          return response;
        },
        {
          startMessage: `Applying ${resourceType} to cluster ${cluster}...`,
          cancelledMessage: `Cancelled applying ${resourceType} to cluster.`,
          successMessage: `${resourceType} applied successfully.`,
          errorMessage: `Failed to apply ${resourceType}.`,
          successCallback: () => {
            onClose();
          },
        }
      );
    } catch (error) {
      console.error('Error applying resource:', error);
      enqueueSnackbar(`Error applying ${resourceType.toLowerCase()}: ${error.message}`, {
        variant: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      // Parse YAML to get resource details
      const resource = YAML.parse(content);

      if (!resource || !resource.kind || !resource.metadata || !resource.metadata.name) {
        throw new Error('Invalid resource information in YAML');
      }

      const cluster = getCluster();
      if (!cluster) {
        throw new Error('No cluster selected');
      }

      // Store name for notification
      const kind = resource.kind;
      const name = resource.metadata.name;
      const namespace = resource.metadata.namespace;

      // Set finalizers to empty array to ensure proper deletion
      resource.metadata.finalizers = [];

      // Send delete request
      const response = await apply(resource, cluster);

      // Show success notification
      const resourceIdentifier = namespace
        ? `${kind} "${name}" in namespace "${namespace}"`
        : `${kind} "${name}"`;

      enqueueSnackbar(`${resourceIdentifier} deleted successfully`, {
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(response);
      }

      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting resource:', error);
      enqueueSnackbar(`Error deleting resource: ${error.message}`, {
        variant: 'error',
      });
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = () => {
    // Show confirmation dialog
    setShowDeleteConfirm(true);
  };

  const getDeleteDialogDescription = () => {
    const resourceIdentifier = resourceNamespace
      ? `${resourceType} "${resourceName}" in namespace "${resourceNamespace}"`
      : `${resourceType} "${resourceName}"`;

    return `Are you sure you want to delete ${resourceIdentifier}?`;
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth="lg"
        fullWidth
        withFullScreen
        style={{ overflow: 'hidden' }}
        onClose={onClose}
      >
        <DialogTitle>
          {isDelete ? (
            <Box>
              <Typography variant="h6" color="error">
                Delete {resourceType}: {resourceName}
              </Typography>
              <Typography variant="body2">
                Review the resource below carefully before deletion.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{title}</Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box height="100%">
            <Editor
              value={content}
              onChange={value => {
                if (value !== undefined) {
                  setContent(value);
                }
              }}
              language="yaml"
              height="500px"
              options={{
                readOnly: isDelete,
                selectOnLineNumbers: true,
                minimap: { enabled: true },
              }}
              theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Box mr={2} display="flex">
            <Box mr={1}>
              <Button variant="outlined" color="primary" onClick={onClose}>
                Cancel
              </Button>
            </Box>
            <Box>
              {isDelete ? (
                <Button variant="contained" color="error" onClick={handleDelete}>
                  Delete Resource
                </Button>
              ) : (
                <Button variant="contained" color="primary" onClick={handleApply}>
                  Apply to Cluster
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Enhanced Confirmation Dialog for Delete Operations */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Delete ${resourceType}`}
        description={
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {getDeleteDialogDescription()}
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Resource details:
              </Typography>
              <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                <strong>Type:</strong> {resourceType}
              </Typography>
              <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                <strong>Name:</strong> {resourceName}
              </Typography>
              {resourceNamespace && (
                <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                  <strong>Namespace:</strong> {resourceNamespace}
                </Typography>
              )}
              {(() => {
                try {
                  const resource = YAML.parse(content);
                  return (
                    <>
                      {resource?.metadata?.labels &&
                        Object.keys(resource.metadata.labels).length > 0 && (
                          <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                            <strong>Labels:</strong>{' '}
                            {Object.entries(resource.metadata.labels)
                              .map(([key, value]) => `${key}=${value}`)
                              .join(', ')}
                          </Typography>
                        )}
                    </>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              This action cannot be undone.
            </Typography>
          </Box>
        }
        handleClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        confirmButtonText="Yes, Delete Resource"
        confirmButtonProps={{ color: 'error' }}
      />
    </>
  );
}
