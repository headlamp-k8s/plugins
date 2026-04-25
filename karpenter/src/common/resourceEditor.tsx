import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ConfirmButton, Dialog, DialogProps } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { DiffEditor } from '@monaco-editor/react';
import { Alert, Box, Button, DialogActions, DialogContent, Typography } from '@mui/material';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCloudProviderDetection } from '../hook/useCloudProviderDetection';
import { getSchemaKey, KARPENTER_SCHEMAS } from '../schemas';

/**
 * Props for the DiffEditorDialog component.
 */
export interface DiffEditorDialogProps extends Omit<DialogProps, 'resource'> {
  /**
   * The Kubernetes resource object being edited.
   * Contains the resource's metadata and specifications.
   */
  resource: KubeObjectInterface;
  /**
   * The original YAML content before any edits.
   * Used as the left side of the diff comparison.
   */
  originalYaml: string;
  /**
   * The modified YAML content to compare against the original.
   * Used as the right side of the diff comparison.
   */
  modifiedYaml: string;
  /**
   * Controls the visibility of the dialog.
   */
  open: boolean;
  /**
   * Callback function invoked when the dialog is closed.
   */
  onClose: () => void;
  /**
   * Custom save handler function.
   * Can be:
   * - A function: Custom save logic
   * - 'default': Use built-in save logic
   * - null: Read-only mode
   */
  onSave?: ((...args: any[]) => void) | 'default' | null;
  /**
   * Custom label for the save button.
   * Defaults to 'Save & Apply' if not provided.
   */
  saveLabel?: string;
  /**
   * Error message to display in the dialog.
   * Typically shown when save operations fail.
   */
  errorMessage?: string;
  /**
   * Custom title for the dialog.
   * Defaults to "Config Editor: {resourceName}" if not provided.
   */
  title?: string;
  /**
   * Custom actions to display in the dialog.
   */
  actions?: React.ReactNode[];
  /**
   * JSON schema identifier for validation.
   */
  schema?: string;
  /**
   * Cloud provider override (optional).
   */
  cloudProvider?: string;
}

export function DiffEditorDialog({
  resource,
  originalYaml,
  modifiedYaml,
  open,
  onClose,
  onSave = 'default',
  saveLabel,
  errorMessage,
  title,
  schema,
  cloudProvider: providedCloudProvider,
  ...other
}: DiffEditorDialogProps) {
  const [currentModifiedYaml, setCurrentModifiedYaml] = useState(modifiedYaml);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const theme = localStorage.getItem('headlampThemePreference');
  const dispatch = useDispatch();
  const editorRef = useRef<any>(null);

  const { cloudProvider: detectedCloudProvider } = useCloudProviderDetection();

  const activeCloudProvider = providedCloudProvider || detectedCloudProvider;

  const ajv = React.useMemo(() => {
    const instance = new Ajv({ allErrors: true });
    addFormats(instance);
    return instance;
  }, []);

  const determineSchemaKey = React.useCallback(() => {
    if (schema) {
      return schema;
    }

    if (activeCloudProvider) {
      return getSchemaKey(activeCloudProvider);
    }

    return 'NodeClass-schema';
  }, [schema, modifiedYaml, activeCloudProvider]);

  const karpenterValidate = React.useMemo(() => {
    const schemaKey = determineSchemaKey();

    const schemaToUse = KARPENTER_SCHEMAS[schemaKey];
    if (!schemaToUse) {
      return null;
    }

    return ajv.compile(schemaToUse);
  }, [ajv, determineSchemaKey]);

  useEffect(() => {
    setCurrentModifiedYaml(modifiedYaml);
    validateContent(modifiedYaml);
  }, [modifiedYaml, open, karpenterValidate]);

  const validateContent = (yamlContent: string) => {
    if (!karpenterValidate) {
      setValidationErrors(['Schema validation not available']);
      return false;
    }

    try {
      const docs = yaml.loadAll(yamlContent);
      const ajvErrors: string[] = [];

      docs.forEach((doc: any, index: number) => {
        if (!doc || typeof doc !== 'object') {
          ajvErrors.push(`Document ${index + 1} is not a valid object.`);
          return;
        }

        const valid = karpenterValidate(doc);
        if (!valid && karpenterValidate.errors) {
          karpenterValidate.errors.forEach(err => {
            const path = err.instancePath || '/';
            ajvErrors.push(`Document ${index + 1} [${path}]: ${err.message}`);
          });
        }
      });

      setValidationErrors(ajvErrors);
      return ajvErrors.length === 0;
    } catch (e) {
      setValidationErrors([`Invalid YAML: ${(e as Error).message}`]);
      return false;
    }
  };

  const handleSave = () => {
    if (validationErrors.length > 0) {
      setError('Please fix validation errors before saving');
      return;
    }

    if (typeof onSave === 'function') {
      onSave(currentModifiedYaml);
    } else if (onSave === 'default') {
      try {
        const newItemDefs = yaml.loadAll(currentModifiedYaml) as KubeObjectInterface[];
        const validItems = newItemDefs.filter(obj => !!obj);

        if (validItems.length === 0) {
          setError('No valid YAML content to apply');
          return;
        }

        const resourceNames = validItems.map(item => item.metadata.name);
        const clusterName = getCluster() || '';

        dispatch(
          // @todo: this should not use redux dispatch but a plugin API instead.
          // @ts-ignore
          clusterAction(() => applyFunc(validItems, clusterName), {
            startMessage: `Applying ${resourceNames.join(',')}…`,
            cancelledMessage: `Cancelled applying ${resourceNames.join(',')}`,
            successMessage: `Applied ${resourceNames.join(',')}.`,
            errorMessage: `Failed to apply ${resourceNames.join(',')}.`,
            cancelUrl: location.pathname,
          })
        );

        onClose();
      } catch (e) {
        setError(`Error applying configuration: ${(e as Error).message}`);
      }
    }
  };

  const applyFunc = async (newItems: KubeObjectInterface[], clusterName: string) => {
    await Promise.allSettled(newItems.map(newItem => apply(newItem, clusterName))).then(
      (values: any) => {
        values.forEach((value: any, index: number) => {
          if (value.status === 'rejected') {
            const errorDetail =
              value.reason?.message ||
              `Failed to apply ${newItems[index].kind} ${newItems[index].metadata.name}`;
            setError(errorDetail);
            throw new Error(errorDetail);
          }
        });
      }
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setCurrentModifiedYaml(newValue);
    validateContent(newValue);
  };

  const isReadOnly = () => onSave === null;

  let dialogTitle = title;
  if (!dialogTitle && resource) {
    const itemName = resource.metadata?.name;
    const cloudProviderDisplay = activeCloudProvider === 'AZURE' ? 'Azure' : 'AWS';
    dialogTitle = `Config Editor (${cloudProviderDisplay}): ${itemName}`;
  }

  return (
    <Dialog
      title={dialogTitle}
      open={open}
      maxWidth="lg"
      fullWidth
      onClose={onClose}
      scroll="paper"
      withFullScreen
      {...other}
    >
      <DialogContent sx={{ height: '80%', overflowY: 'hidden' }}>
        {(validationErrors.length > 0 || error) && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">
              <Typography variant="subtitle2">Validation Issues:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {error && !validationErrors.includes(error) && <li>{error}</li>}
              </ul>
            </Alert>
          </Box>
        )}

        <DiffEditor
          height="70vh"
          language="yaml"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          original={originalYaml}
          modified={currentModifiedYaml}
          options={{
            readOnly: isReadOnly(),
            renderSideBySide: true,
            originalEditable: false,
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            diffWordWrap: 'on',
            glyphMargin: true,
          }}
          onMount={editor => {
            editorRef.current = editor;
            const modifiedModel = editor.getModel()?.modified;
            if (modifiedModel) {
              modifiedModel.onDidChangeContent(() => {
                handleEditorChange(modifiedModel.getValue());
              });
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        {!isReadOnly() && (
          <ConfirmButton
            disabled={modifiedYaml === currentModifiedYaml}
            color="secondary"
            variant="contained"
            aria-label={'Undo'}
            onConfirm={() => {
              setCurrentModifiedYaml(modifiedYaml);
              validateContent(modifiedYaml);
            }}
            confirmTitle={'Are you sure?'}
            confirmDescription={
              'This will discard your changes in the editor. Do you want to proceed ?'
            }
          >
            Undo Changes
          </ConfirmButton>
        )}
        <div style={{ flex: '1 0 0' }} />
        {errorMessage && !validationErrors.includes(errorMessage) && (
          <Typography color="error">{errorMessage}</Typography>
        )}
        <div style={{ flex: '1 0 0' }} />
        <Button onClick={onClose} color="secondary" variant="contained">
          Close
        </Button>
        {!isReadOnly() && (
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={modifiedYaml === currentModifiedYaml || validationErrors.length > 0}
          >
            {saveLabel || 'Save & Apply'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
