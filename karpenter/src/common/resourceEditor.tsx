import {
  apply,
  clusterAction,
  getCluster,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib';
import { ConfirmButton, Dialog, DialogProps } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DiffEditor } from '@monaco-editor/react';
import { Button, DialogActions, DialogContent, Typography } from '@mui/material';
import yaml from 'js-yaml';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export interface DiffEditorDialogProps extends DialogProps {
  resource: KubeObjectInterface;
  originalYaml: string;
  modifiedYaml: string;
  open: boolean;
  onClose: () => void;
  onSave?: ((...args: any[]) => void) | 'default' | null;
  saveLabel?: string;
  errorMessage?: string;
  title?: string;
  actions?: React.ReactNode[];
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
  ...other
}: DiffEditorDialogProps) {
  const [currentModifiedYaml, setCurrentModifiedYaml] = useState(modifiedYaml);
  const [error, setError] = useState('');
  const theme = localStorage.getItem('headlampThemePreference');
  const dispatch = useDispatch();

  useEffect(() => {
    setCurrentModifiedYaml(modifiedYaml);
  }, [modifiedYaml, open]);

  const handleSave = () => {
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
        setError(`Error parsing YAML: ${(e as Error).message}`);
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
    setCurrentModifiedYaml(value || '');
  };

  const isReadOnly = () => onSave === null;

  let dialogTitle = title;
  if (!dialogTitle && resource) {
    const itemName = resource.metadata?.name;
    dialogTitle = `Config Editor: ${itemName}`;
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
        <DiffEditor
          height="80vh"
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
          }}
          onMount={editor => {
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
            onConfirm={() => setCurrentModifiedYaml(modifiedYaml)}
            confirmTitle={'Are you sure?'}
            confirmDescription={
              'This will discard your changes in the editor. Do you want to proceed ?'
            }
          >
            Undo Changes
          </ConfirmButton>
        )}
        <div style={{ flex: '1 0 0' }} />
        {(error || errorMessage) && <Typography color="error">{error || errorMessage}</Typography>}
        <div style={{ flex: '1 0 0' }} />
        <Button onClick={onClose} color="secondary" variant="contained">
          Close
        </Button>
        {!isReadOnly() && (
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={modifiedYaml === currentModifiedYaml || !!error}
          >
            {saveLabel || 'Save & Apply'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
