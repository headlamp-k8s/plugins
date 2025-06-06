import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
  const { enqueueSnackbar } = useSnackbar();
  const themeName = localStorage.getItem('headlampThemePreference');

  // Reset content when yamlContent prop changes (e.g. when dialog is opened with new content)
  useEffect(() => {
    if (open) {
      setContent(yamlContent);
    }
  }, [yamlContent, open]);

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
  }, [yamlContent, resourceType]);

  // Handle content changes from the editor
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  const handleApply = () => {
    try {
      const cluster = getCluster();
      if (!cluster) {
        throw new Error('No cluster selected');
      }

      // Use the current content from state, which contains user edits
      const resource = YAML.parse(content);
      if (!resource) {
        throw new Error('Invalid YAML content');
      }

      // Ensure we have the resourceType from the YAML content if not already set
      const displayResourceType = resourceType || resource.kind || 'Resource';
      // close the editor when user applies the resource
      onClose();
      clusterAction(
        async () => {
          console.log('Applying resource with content:', content);
          const response = await apply(resource, cluster);
          if (onSuccess) {
            onSuccess(response);
          }
          return response;
        },
        {
          startMessage: `Applying ${displayResourceType} to cluster ${cluster}...`,
          cancelledMessage: `Cancelled applying ${displayResourceType} to cluster.`,
          successMessage: `${displayResourceType} applied successfully.`,
          errorMessage: `Failed to apply ${displayResourceType}.`,
          successCallback: () => {
            onClose();
          },
        }
      );
    } catch (error) {
      console.error('Error applying resource:', error);
      enqueueSnackbar(`Error applying resource: ${error.message}`, {
        variant: 'error',
      });
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      withFullScreen
      style={{ overflow: 'hidden' }}
      onClose={onClose}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box height="100%">
          <Editor
            value={content}
            onChange={handleEditorChange}
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
            <Button variant="contained" color="primary" onClick={handleApply}>
              Apply to Cluster
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
