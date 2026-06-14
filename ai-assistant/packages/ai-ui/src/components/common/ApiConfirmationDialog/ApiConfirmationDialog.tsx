import { Box, Typography } from '@mui/material';
import jsYaml from 'js-yaml';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DefaultConfirmDialog,
  type DefaultConfirmDialogProps,
  DefaultEditorDialog,
  type DefaultEditorDialogProps,
} from '../../defaults/DefaultSlots/DefaultSlots';

interface ResourceInfo {
  kind: string;
  name: string;
  namespace?: string;
}

/** Removes a YAML block-scalar prefix accidentally included by model output. */
function cleanYamlContent(content: string): string {
  const trimmed = content.trim();
  return trimmed.startsWith('|-') ? trimmed.slice(2).trim() : trimmed;
}

/** @returns Whether an untrusted parsed body is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Extracts resource metadata from a parsed Kubernetes body. */
function getBodyResourceInfo(value: unknown): ResourceInfo | null {
  if (!isRecord(value) || typeof value.kind !== 'string' || !isRecord(value.metadata)) return null;
  if (typeof value.metadata.name !== 'string') return null;
  return {
    kind: value.kind,
    name: value.metadata.name,
    namespace: typeof value.metadata.namespace === 'string' ? value.metadata.namespace : undefined,
  };
}

/** Extracts best-effort resource identity from a Kubernetes API URL. */
function getUrlResourceInfo(url: string): ResourceInfo | null {
  const path = url.split(/[?#]/, 1)[0];
  const parts = path.split('/').filter(Boolean);
  const namespacePosition = parts.indexOf('namespaces');
  if (namespacePosition >= 0) {
    const namespace = parts[namespacePosition + 1];
    const kind = parts[namespacePosition + 2];
    const name = parts[namespacePosition + 3];
    return namespace && kind && name ? { kind, name, namespace } : null;
  }
  if (parts.length < 2) return null;
  const name = parts.at(-1);
  const kind = parts.at(-2);
  if (!name || !kind) return null;
  return {
    kind,
    name,
  };
}

/** Returns resource identity in the dictionary shape required by i18next. */
function getResourceTranslationValues(
  resourceInfo: ResourceInfo
): Record<string, string | undefined> {
  return {
    kind: resourceInfo.kind,
    name: resourceInfo.name,
    namespace: resourceInfo.namespace,
  };
}

/** Parses and normalizes an optional request body without throwing. */
function processBody(body: string | undefined): {
  content: string;
  resourceInfo: ResourceInfo | null;
} {
  if (!body) return { content: '', resourceInfo: null };
  const content = cleanYamlContent(body);
  try {
    const parsed: unknown = jsYaml.load(content);
    if (parsed === undefined) return { content, resourceInfo: null };
    return {
      content: jsYaml.dump(parsed).trim(),
      resourceInfo: getBodyResourceInfo(parsed),
    };
  } catch {
    return { content, resourceInfo: null };
  }
}

/** Props for the API confirmation and editor flow. */
export interface ApiConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  method: string;
  url: string;
  body?: string;
  onConfirm: (editedBody?: string, resourceInfo?: string) => void;
  isLoading?: boolean;
  /** Completed API result retained for host API compatibility; confirmation flows do not render it. */
  result?: unknown;
  error?: string;
  ConfirmDialogSlot?: React.ComponentType<DefaultConfirmDialogProps>;
  EditorDialogSlot?: React.ComponentType<DefaultEditorDialogProps>;
}

/**
 * Routes Kubernetes API requests through GET auto-confirm, destructive confirm,
 * patch confirmation, or editable body flows.
 *
 * @param props - Request details, callbacks, external state, and dialog slots.
 * @returns The confirmation/editor UI for the request method, or null.
 */
export default function ApiConfirmationDialog({
  open,
  onClose,
  method,
  url,
  body,
  onConfirm,
  isLoading = false,
  error,
  ConfirmDialogSlot = DefaultConfirmDialog,
  EditorDialogSlot = DefaultEditorDialog,
}: ApiConfirmationDialogProps): React.ReactElement | null {
  const { t } = useTranslation();
  const normalizedMethod = method.toUpperCase();
  const processedBody = React.useMemo(() => processBody(body), [body]);
  const resourceInfo = React.useMemo(
    () => processedBody.resourceInfo || getUrlResourceInfo(url),
    [processedBody.resourceInfo, url]
  );
  const serializedResourceInfo = resourceInfo ? JSON.stringify(resourceInfo) : undefined;
  const resourceTranslationValues = resourceInfo
    ? getResourceTranslationValues(resourceInfo)
    : undefined;
  const autoConfirmedRequest = React.useRef<string | null>(null);

  React.useEffect(() => {
    const requestKey = `${normalizedMethod}:${url}:${body ?? ''}`;
    if (!open || normalizedMethod !== 'GET') {
      autoConfirmedRequest.current = null;
      return;
    }
    if (autoConfirmedRequest.current === requestKey) return;
    autoConfirmedRequest.current = requestKey;
    onConfirm(undefined, serializedResourceInfo);
    onClose();
  }, [body, normalizedMethod, onClose, onConfirm, open, serializedResourceInfo, url]);

  const getTitle = (): string => {
    if (!resourceInfo) {
      if (normalizedMethod === 'POST') return t('Create Resource');
      return t('Update Resource');
    }
    return normalizedMethod === 'POST'
      ? t('Create {{kind}}: {{name}}', resourceTranslationValues)
      : t('Update {{kind}}: {{name}}', resourceTranslationValues);
  };

  if (!url || !method || !open || normalizedMethod === 'GET') return null;

  if (normalizedMethod === 'DELETE') {
    return (
      <ConfirmDialogSlot
        open
        handleClose={isLoading ? () => undefined : onClose}
        onConfirm={() => {
          onConfirm(undefined, serializedResourceInfo);
          onClose();
        }}
        title={
          resourceInfo ? t('Delete {{kind}}', resourceTranslationValues) : t('Delete Resource')
        }
        description={
          <Box>
            {error && <Typography color="error.main">{error}</Typography>}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {resourceInfo?.namespace
                ? t(
                    'Are you sure you want to delete the {{kind}} "{{name}}" in namespace "{{namespace}}"?',
                    resourceTranslationValues
                  )
                : resourceInfo
                ? t(
                    'Are you sure you want to delete the {{kind}} "{{name}}"?',
                    resourceTranslationValues
                  )
                : t('Are you sure you want to delete this resource?')}
            </Typography>
            {resourceInfo && (
              <Box sx={{ p: 2, borderRadius: 1, mb: 2 }}>
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
              {isLoading ? t('Deleting...') : t('This action cannot be undone.')}
            </Typography>
          </Box>
        }
        confirmLabel={
          resourceInfo
            ? t('Yes, Delete {{kind}}', resourceTranslationValues)
            : t('Yes, Delete Resource')
        }
        disabled={isLoading}
      />
    );
  }

  if (normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') {
    return (
      <ConfirmDialogSlot
        open
        handleClose={isLoading ? () => undefined : onClose}
        onConfirm={() => {
          onConfirm(processedBody.content, serializedResourceInfo);
          onClose();
        }}
        title={
          resourceInfo
            ? t('Apply Patch to {{kind}}: {{name}}', resourceTranslationValues)
            : t('Apply Patch to Resource')
        }
        description={
          <Box>
            {error && <Typography color="error.main">{error}</Typography>}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t('The following patch will be applied to the resource:')}
            </Typography>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <pre>{processedBody.content}</pre>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {t(
                'Are you sure you want to apply this patch? The system will merge this patch with the current resource and update it.'
              )}
            </Typography>
          </Box>
        }
        confirmLabel={isLoading ? t('Applying...') : t('Yes, Apply Patch')}
        disabled={isLoading}
      />
    );
  }

  return (
    <EditorDialogSlot
      item={processedBody.content}
      open
      onClose={isLoading ? () => undefined : onClose}
      setOpen={(_nextOpen: boolean) => undefined}
      saveLabel={isLoading ? t('Applying...') : t('Apply')}
      onSave={editedBody => {
        onConfirm(editedBody, serializedResourceInfo);
        onClose();
      }}
      title={getTitle()}
      disabled={isLoading}
    />
  );
}
