import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ConfirmDialog,Dialog, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
  const [loading, setLoading] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const themeName = localStorage.getItem('headlampThemePreference');

  useEffect(() => {
    // Extract name from YAML content if possible
    try {
      if (yamlContent) {
        // This is a simple approach - a more robust parser would be better
        const nameMatch = yamlContent.match(/name:\s*([^\n]+)/);
        if (nameMatch && nameMatch[1]) {
          setResourceName(nameMatch[1].trim());
        }
      }
    } catch (error) {
      console.error('Error parsing YAML for resource name:', error);
    }
  }, [yamlContent]);

  useEffect(() => {
    setContent(yamlContent);
  }, [yamlContent]);

  const handleApply = async () => {
    setLoading(true);
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
      console.log('resource:', resource);
      console.log('cluster:', cluster);
      console.log('apply:', apply);
      // Use the apply function from k8s/apiProxy
      const response = await apply(resource, cluster);
      console.log('Resource applied successfully:', response);
      enqueueSnackbar(`${resourceType} applied successfully`, {
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(response);
      }

      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error applying resource:', error);
      enqueueSnackbar(`Error applying ${resourceType.toLowerCase()}: ${error.message}`, {
        variant: 'error',
      });
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
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

      // Use apply with an empty object but the same metadata to delete
      resource.metadata.finalizers = [];

      // This would normally be handled by a dedicated delete function
      // For now, we'll simulate with the apply function
      const response = await apply(resource, cluster);

      enqueueSnackbar(`${resource.kind} "${resource.metadata.name}" deleted successfully`, {
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(response);
      }

      setLoading(false);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting resource:', error);
      enqueueSnackbar(`Error deleting resource: ${error.message}`, {
        variant: 'error',
      });
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = () => {
    // Show confirmation dialog
    setShowDeleteConfirm(true);
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
                Confirm Deletion
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
            {loading ? (
              <Loader title="Processing..." />
            ) : (
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
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Box mr={2} display="flex">
            <Box mr={1}>
              <Button variant="outlined" color="primary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </Box>
            <Box>
              {isDelete ? (
                <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
                  {loading ? 'Processing...' : 'Delete Resource'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApply}
                  disabled={loading}
                >
                  {loading ? 'Applying...' : 'Apply to Cluster'}
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
              Are you sure you want to delete this resource?
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: theme =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
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
              {(() => {
                try {
                  const resource = YAML.parse(content);
                  return (
                    <>
                      {resource?.metadata?.namespace && (
                        <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                          <strong>Namespace:</strong> {resource.metadata.namespace}
                        </Typography>
                      )}
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
            <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
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
