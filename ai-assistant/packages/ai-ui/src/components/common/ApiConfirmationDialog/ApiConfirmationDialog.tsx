import { Box, Typography } from '@mui/material';
import jsYaml from 'js-yaml';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DefaultConfirmDialog,
  DefaultEditorDialog,
} from '../../defaults/DefaultSlots/DefaultSlots';

// Helper function to clean YAML content by removing the |- prefix if present
function cleanYamlContent(content: string): string {
  if (content.trim().startsWith('|-')) {
    return content.trim().substring(2).trim();
  }
  return content.trim();
}

/** Props for the ApiConfirmationDialog that previews and confirms Kubernetes API requests. */
export interface ApiConfirmationDialogProps {
  /** Whether the confirmation dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is dismissed. */
  onClose: () => void;
  /** HTTP method of the API request (e.g. "POST", "DELETE"). */
  method: string;
  /** Target Kubernetes API URL for the request. */
  url: string;
  /** Optional request body content (typically YAML or JSON). */
  body?: string;
  /** Callback invoked when the user confirms the action, with optional edited body. */
  onConfirm: (editedBody?: string, resourceInfo?: string) => void;
  /** Whether the API request is currently in progress. */
  isLoading?: boolean;
  /** The result of the API call, if completed. */
  result?: any;
  /** Error message if the API call failed. */
  error?: string;
  /** Slot for the confirm dialog component. Falls back to a MUI-based confirm dialog. */
  ConfirmDialogSlot?: React.ComponentType<any>;
  /** Slot for the editor dialog component. Falls back to a MUI-based editor dialog. */
  EditorDialogSlot?: React.ComponentType<any>;
}

export default function ApiConfirmationDialog({
  open,
  onClose,
  method,
  url,
  body,
  onConfirm,
  ConfirmDialogSlot = DefaultConfirmDialog,
  EditorDialogSlot = DefaultEditorDialog,
}: ApiConfirmationDialogProps) {
  const { t } = useTranslation();
  const [editedBody, setEditedBody] = React.useState('');
  const [resourceInfo, setResourceInfo] = React.useState<{
    kind: string;
    name: string;
    namespace?: string;
  } | null>(null);
  // const cluster = getCluster();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [openEditorDialog, setOpenEditorDialog] = React.useState(true);
  const [showUpdateConfirm, setShowUpdateConfirm] = React.useState(false);

  React.useEffect(() => {
    if (method.toUpperCase() === 'DELETE') {
      setShowDeleteConfirm(true);
    }
    if (body) {
      try {
        const processedBody = cleanYamlContent(body);

        let parsed;
        try {
          parsed = jsYaml.load(processedBody);
        } catch (yamlError) {
          try {
            parsed = JSON.parse(processedBody);
          } catch (jsonError) {
            console.warn('Failed to parse body as YAML or JSON:', yamlError, jsonError);
            parsed = null;
          }
        }

        if (parsed) {
          const yamlContent = jsYaml.dump(parsed).trim();
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
    if (open && method.toUpperCase() === 'PUT' && body && resourceInfo) {
      const processedBody = cleanYamlContent(body);
      try {
        const parsed = jsYaml.load(processedBody);
        const yamlContent = jsYaml.dump(parsed).trim();
        setEditedBody(yamlContent);
      } catch (e) {
        setEditedBody(processedBody);
      }
      setShowUpdateConfirm(true);
    }
  }, [open, method, body, resourceInfo]);

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onConfirm(JSON.stringify(resourceInfo));
    onClose();
  };

  const handleUpdateConfirm = () => {
    setShowUpdateConfirm(false);
    onConfirm(editedBody, JSON.stringify(resourceInfo));
    onClose();
  };

  function handleSave(items: any) {
    const newItemDef = Array.isArray(items) ? items[0] : items;

    onConfirm(JSON.stringify(newItemDef));
    setOpenEditorDialog(false);
    onClose();
  }
  const getTitle = () => {
    if (resourceInfo) {
      return method.toUpperCase() === 'DELETE'
        ? t('Delete {{kind}}: {{name}}', { kind: resourceInfo.kind, name: resourceInfo.name })
        : method.toUpperCase() === 'POST'
        ? t('Create {{kind}}: {{name}}', { kind: resourceInfo.kind, name: resourceInfo.name })
        : method.toUpperCase() === 'GET'
        ? t('Fetch {{kind}}: {{name}}', { kind: resourceInfo.kind, name: resourceInfo.name })
        : t('Update {{kind}}: {{name}}', { kind: resourceInfo.kind, name: resourceInfo.name });
    }

    return method.toUpperCase() === 'DELETE'
      ? t('Delete Resource')
      : method.toUpperCase() === 'POST'
      ? t('Create Resource')
      : method.toUpperCase() === 'GET'
      ? t('Fetch Resource')
      : t('Update Resource');
  };

  if (!url || !method) {
    return null;
  }
  if (showDeleteConfirm) {
    return (
      <ConfirmDialogSlot
        // @ts-ignore
        open={showDeleteConfirm}
        handleClose={() => {
          setShowDeleteConfirm(false);
          onClose();
        }}
        onConfirm={handleDeleteConfirm}
        title={
          resourceInfo ? t('Delete {{kind}}', { kind: resourceInfo.kind }) : t('Delete Resource')
        }
        description={
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {resourceInfo
                ? resourceInfo.namespace
                  ? t(
                      'Are you sure you want to delete the {{kind}} "{{name}}" in namespace "{{namespace}}"?',
                      {
                        kind: resourceInfo.kind,
                        name: resourceInfo.name,
                        namespace: resourceInfo.namespace,
                      }
                    )
                  : t('Are you sure you want to delete the {{kind}} "{{name}}"?', {
                      kind: resourceInfo.kind,
                      name: resourceInfo.name,
                    })
                : t('Are you sure you want to delete this resource?')}
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
                  {t('Resource details:')}
                </Typography>
                <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                  <strong>{t('Type:')}</strong> {resourceInfo.kind}
                </Typography>
                <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                  <strong>{t('Name:')}</strong> {resourceInfo.name}
                </Typography>
                {resourceInfo.namespace && (
                  <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                    <strong>{t('Namespace:')}</strong> {resourceInfo.namespace}
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {t('This action cannot be undone.')}
            </Typography>
          </Box>
        }
        confirmLabel={
          resourceInfo
            ? t('Yes, Delete {{kind}}', { kind: resourceInfo.kind })
            : t('Yes, Delete Resource')
        }
      />
    );
  }

  if (method.toUpperCase() === 'PUT' && showUpdateConfirm) {
    return (
      <ConfirmDialogSlot
        // @todo: open does exist on ConfirmDialog, but TS is not recognizing it.
        // @ts-ignore
        open={showUpdateConfirm}
        handleClose={() => {
          setShowUpdateConfirm(false);
          onClose();
        }}
        onConfirm={handleUpdateConfirm}
        title={
          resourceInfo
            ? t('Apply Patch to {{kind}}: {{name}}', {
                kind: resourceInfo.kind,
                name: resourceInfo.name,
              })
            : t('Apply Patch to Resource')
        }
        description={
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t('The following patch will be applied to the resource:')}
            </Typography>
            <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
              <pre>{editedBody}</pre>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {t(
                'Are you sure you want to apply this patch? The system will merge this patch with the current resource and update it.'
              )}
            </Typography>
          </Box>
        }
        confirmLabel={t('Yes, Apply Patch')}
      />
    );
  }

  // Auto-confirm GET requests via effect to avoid side effects during render
  const hasAutoConfirmedGet = useRef(false);
  useEffect(() => {
    if (open && method.toUpperCase() === 'GET' && !hasAutoConfirmedGet.current) {
      hasAutoConfirmedGet.current = true;
      onConfirm();
      onClose();
    }
    if (!open) {
      hasAutoConfirmedGet.current = false;
    }
  }, [open, method, onConfirm, onClose]);

  if (method.toUpperCase() === 'GET') {
    return null;
  }

  return (
    <EditorDialogSlot
      item={editedBody}
      // @ts-ignore
      open={openEditorDialog}
      onClose={() => setOpenEditorDialog(false)}
      setOpen={setOpenEditorDialog}
      saveLabel={t('Apply')}
      onSave={handleSave}
      title={getTitle()}
    />
  );
}
