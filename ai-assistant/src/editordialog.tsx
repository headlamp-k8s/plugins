import { clusterAction, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import Editor from '@monaco-editor/react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import jsYaml from 'js-yaml';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';

type EditorDialogProps = {
  open: boolean;
  onClose: () => void;
  yamlContent: string;
  title: string;
  resourceType?: string;
  isDelete?: boolean;
  onSuccess?: (response: any) => void;
  onFailure?: (error: any, operationType: string, resourceInfo?: any) => void;
};

export default function EditorDialog({
  open,
  onClose,
  yamlContent,
  title,
  resourceType = 'Resource',
  isDelete = false,
  onSuccess,
  onFailure,
}: EditorDialogProps) {
  const [content, setContent] = useState(yamlContent);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const themeName = localStorage.getItem('headlampThemePreference');

  // Reset content when yamlContent prop changes (e.g. when dialog is opened with new content)
  useEffect(() => {
    if (open) {
      setContent(yamlContent);
    }
  }, [yamlContent, open]);

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
        throw new Error(t('No cluster selected'));
      }

      // Use the current content from state, which contains user edits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resource = jsYaml.load(content) as any;
      if (!resource) {
        throw new Error(t('Invalid YAML content'));
      }

      // Ensure we have the resourceType from the YAML content if not already set
      const displayResourceType = resourceType || resource.kind || 'Resource';
      // close the editor when user applies the resource
      onClose();
      clusterAction(
        async () => {
          try {
            const response = await apply(resource, cluster);
            if (onSuccess) {
              onSuccess(response);
            }
            return response;
          } catch (error) {
            // Call onFailure if the API request fails
            if (onFailure) {
              const resourceInfo = {
                kind: resource.kind,
                name: resource.metadata?.name,
                namespace: resource.metadata?.namespace,
              };
              onFailure(error, 'PUT', resourceInfo);
            }
            throw error; // Re-throw to let clusterAction handle UI notifications
          }
        },
        {
          startMessage: t('Applying {{resourceType}} to cluster {{cluster}}...', {
            resourceType: displayResourceType,
            cluster,
          }),
          cancelledMessage: t('Cancelled applying {{resourceType}} to cluster.', {
            resourceType: displayResourceType,
          }),
          successMessage: t('{{resourceType}} applied successfully.', {
            resourceType: displayResourceType,
          }),
          errorMessage: t('Failed to apply {{resourceType}}.', {
            resourceType: displayResourceType,
          }),
        }
      );
    } catch (error) {
      console.error('Error applying resource:', error);
      enqueueSnackbar(
        t('Error applying resource: {{message}}', {
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          variant: 'error',
        }
      );
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
              {t('Cancel')}
            </Button>
          </Box>
          <Box>
            <Button variant="contained" color="primary" onClick={handleApply}>
              {t('Apply to Cluster')}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
