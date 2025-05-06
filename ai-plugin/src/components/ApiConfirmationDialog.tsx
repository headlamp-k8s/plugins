import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ConfirmDialog, EditorDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Typography } from '@mui/material';
import React from 'react';
import YAML from 'yaml';

// Helper function to merge two objects deeply
function mergeDeep(target: any, source: any) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      target[key] = mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Helper function to clean YAML content by removing the |- prefix if present
function cleanYamlContent(content: string): string {
  if (content.trim().startsWith('|-')) {
    return content.trim().substring(2).trim();
  }
  return content.trim();
}

interface ApiConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  method: string;
  url: string;
  body?: string;
  onConfirm: (editedBody?: string) => void; // Updated to accept edited body
  isLoading?: boolean;
  result?: any;
  error?: string;
}

export default function ApiConfirmationDialog({
  open,
  onClose,
  method,
  url,
  body,
  onConfirm,
}: ApiConfirmationDialogProps) {
  const [editedBody, setEditedBody] = React.useState('');
  const [resourceInfo, setResourceInfo] = React.useState<{
    kind: string;
    name: string;
    namespace?: string;
  } | null>(null);
  const cluster = getCluster();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [openEditorDialog, setOpenEditorDialog] = React.useState(true);

  React.useEffect(() => {
    if (method.toUpperCase() === 'DELETE') {
      setShowDeleteConfirm(true);
    }
    if (body) {
      try {
        const processedBody = cleanYamlContent(body);

        let parsed;
        try {
          parsed = YAML.parse(processedBody);
        } catch (yamlError) {
          try {
            parsed = JSON.parse(processedBody);
          } catch (jsonError) {
            console.warn('Failed to parse body as YAML or JSON:', yamlError, jsonError);
            parsed = null;
          }
        }

        if (parsed) {
          const yamlContent = YAML.stringify(parsed).trim();
          setEditedBody(yamlContent);

          if (parsed.kind && parsed.metadata && parsed.metadata.name) {
            setResourceInfo({
              kind: parsed.kind,
              name: parsed.metadata.name,
              namespace: parsed.metadata.namespace,
            });
          } else {
            setResourceInfo(null);
          }
        } else {
          setEditedBody(processedBody);
          setResourceInfo(null);
        }
      } catch (e) {
        console.warn('Unexpected error during body processing:', e);
        setEditedBody(cleanYamlContent(body));
        setResourceInfo(null);
      }
    } else {
      setEditedBody('');
      setResourceInfo(null);
    }
  }, [body, method]);

  React.useEffect(() => {
    if (!resourceInfo && url) {
      const urlParts = url.split('/');
      const nameIndex = urlParts.length - 1;
      if (nameIndex > 0) {
        const resourceTypeIndex = nameIndex - 1;
        let namespaceIndex = -1;

        const namespacePos = urlParts.indexOf('namespaces');
        if (namespacePos >= 0 && namespacePos + 1 < urlParts.length) {
          namespaceIndex = namespacePos + 1;
        }

        if (resourceTypeIndex > 0) {
          setResourceInfo({
            kind: urlParts[resourceTypeIndex],
            name: urlParts[nameIndex],
            namespace: namespaceIndex > 0 ? urlParts[namespaceIndex] : undefined,
          });
        }
      }
    }
  }, [url, resourceInfo]);

  React.useEffect(() => {
    if (open && ['PUT', 'PATCH'].includes(method.toUpperCase()) && body && resourceInfo) {
      (async () => {
        try {
          const response = await clusterRequest(url, {
            method: 'GET',
            cluster,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });
          const existingResource = await response;
          const patchObj = YAML.parse(body);
          const mergedResource = mergeDeep(existingResource, patchObj);
          const mergedYAML = YAML.stringify(mergedResource).trim();

          setEditedBody(cleanYamlContent(mergedYAML));
        } catch (e) {
          console.error('Failed to fetch or merge resource', e);
          setEditedBody(body.trim());
        }
      })();
    }
  }, [open, method, url, body, resourceInfo]);

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onConfirm(JSON.stringify(resourceInfo));
    onClose();
  };

  function handleSave(items) {
    const newItemDef = Array.isArray(items) ? items[0] : items;

    onConfirm(JSON.stringify(newItemDef));
    setOpenEditorDialog(false);
    onClose();
  }
  const getTitle = () => {
    const base =
      method.toUpperCase() === 'DELETE'
        ? 'Delete'
        : method.toUpperCase() === 'POST'
        ? 'Create'
        : method.toUpperCase() === 'GET'
        ? 'Fetch'
        : 'Update';

    if (resourceInfo) {
      return `${base} ${resourceInfo.kind}: ${resourceInfo.name}`;
    }

    return `${base} Resource`;
  };

  if (!url || !method) {
    return null;
  }
  if (showDeleteConfirm) {
    return (
      <ConfirmDialog
        open={showDeleteConfirm}
        handleClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${resourceInfo?.kind || 'Resource'}`}
        description={
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {resourceInfo
                ? `Are you sure you want to delete the ${resourceInfo.kind} "${resourceInfo.name}"${
                    resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
                  }?`
                : 'Are you sure you want to delete this resource?'}
            </Typography>
            {resourceInfo && (
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
                  <strong>Type:</strong> {resourceInfo.kind}
                </Typography>
                <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                  <strong>Name:</strong> {resourceInfo.name}
                </Typography>
                {resourceInfo.namespace && (
                  <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                    <strong>Namespace:</strong> {resourceInfo.namespace}
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              This action cannot be undone.
            </Typography>
          </Box>
        }
        confirmButtonProps={{ color: 'error' }}
        confirmButtonText={`Yes, Delete ${resourceInfo?.kind || 'Resource'}`}
      />
    );
  }

  if (method.toUpperCase() === 'GET') {
    onConfirm();
    onClose();
    return null;
  }

  return (
    <EditorDialog
      item={editedBody}
      open={openEditorDialog}
      onClose={() => setOpenEditorDialog(false)}
      setOpen={setOpenEditorDialog}
      saveLabel="Apply"
      onSave={handleSave}
      title={getTitle()}
    />
  );
}
