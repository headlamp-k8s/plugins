/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { NotebookClass } from '../../resources/notebook';
import { PodDefaultClass } from '../../resources/podDefault';
import {
  buildNotebookObjects,
  defaultLimit,
  getDefaultNotebookFormValues,
  GPU_VENDORS,
  MAX_NAME_LENGTH,
  MAX_NAMESPACE_LENGTH,
  NOTEBOOK_IMAGES,
  NotebookFormErrorCode,
  NotebookFormErrors,
  NotebookFormValues,
  NotebookServerType,
  validateNotebookForm,
} from './notebookCreate';

/** A PodDefault the user can apply: its selector label and description. */
export interface PodDefaultOption {
  label: string;
  description: string;
}

/** Turns PodDefaults into options. A PodDefault applies through the first key of its selector. */
export function getPodDefaultOptions(podDefaults: PodDefaultClass[]): PodDefaultOption[] {
  const options: PodDefaultOption[] = [];
  podDefaults.forEach(podDefault => {
    const label = Object.keys(podDefault.matchLabels || {})[0];
    if (label) {
      options.push({ label, description: podDefault.spec?.desc || podDefault.metadata.name });
    }
  });
  return options;
}

function useErrorText() {
  const { t } = useTranslation();
  return (
    code?: NotebookFormErrorCode,
    maxLength: number = MAX_NAME_LENGTH
  ): string | undefined => {
    switch (code) {
      case undefined:
        return undefined;
      case 'required':
        return t('Required');
      case 'invalidName':
        return t(
          'Use lowercase letters, numbers and "-", and start and end with a letter or number'
        );
      case 'nameTooLong':
        return t('Use at most {{max}} characters', { max: maxLength });
      case 'notPositiveNumber':
        return t('Enter a number greater than 0');
      case 'notPositiveInteger':
        return t('Enter a whole number greater than 0');
      case 'limitBelowRequest':
        return t('The limit cannot be lower than the request');
      case 'notAbsolutePath':
        return t('Enter an absolute path, such as /home/jovyan');
    }
  };
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {props.title}
      </Typography>
      {props.children}
    </Box>
  );
}

const twoColumns = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 };

export interface NotebookCreateFormProps {
  values: NotebookFormValues;
  /** Errors to show. Pass `{}` to show none, e.g. before the first submit. */
  errors: NotebookFormErrors;
  onChange: (values: NotebookFormValues) => void;
  /** Namespaces to offer. A namespace can also be typed in, for users who can't list them. */
  namespaces: string[];
  /** True while the namespaces are loading. */
  namespacesLoading?: boolean;
  /** PVC names in the selected namespace, offered for an existing workspace. */
  claimNames: string[];
  podDefaults: PodDefaultOption[];
  disabled?: boolean;
}

/** The fields of the create form. It holds no state, so it can be shown in Storybook. */
export function NotebookCreateForm(props: NotebookCreateFormProps) {
  const {
    values,
    errors,
    onChange,
    namespaces,
    namespacesLoading,
    claimNames,
    podDefaults,
    disabled,
  } = props;
  const { t } = useTranslation();
  const errorText = useErrorText();

  function set<K extends keyof NotebookFormValues>(key: K, value: NotebookFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function setWorkspace(changes: Partial<NotebookFormValues['workspace']>) {
    set('workspace', { ...values.workspace, ...changes });
  }

  function setServerType(serverType: NotebookServerType) {
    // Switch to the new type's default image, unless the user typed a custom image.
    const isPreset = Object.values(NOTEBOOK_IMAGES).some(images => images.includes(values.image));
    onChange({
      ...values,
      serverType,
      image: isPreset ? NOTEBOOK_IMAGES[serverType][0] : values.image,
    });
  }

  function togglePodDefault(label: string) {
    const selected = values.podDefaultLabels.includes(label)
      ? values.podDefaultLabels.filter(l => l !== label)
      : [...values.podDefaultLabels, label];
    set('podDefaultLabels', selected);
  }

  const limitPlaceholder = (request: string, unit = '') =>
    Number(request) > 0 ? `${defaultLimit(request)}${unit}` : '';

  return (
    <Box>
      <Box sx={twoColumns}>
        <TextField
          label={t('Name')}
          value={values.name}
          onChange={e => set('name', e.target.value)}
          error={!!errors.name}
          helperText={errorText(errors.name)}
          disabled={disabled}
          required
        />
        <Autocomplete
          // In multi-user Kubeflow, users often can't list namespaces, so they can type one.
          freeSolo
          autoSelect
          options={namespaces}
          loading={namespacesLoading}
          value={values.namespace || null}
          onChange={(_, namespace) => set('namespace', (namespace || '').trim())}
          disabled={disabled}
          renderInput={params => (
            <TextField
              {...params}
              label={t('Namespace')}
              error={!!errors.namespace}
              helperText={errorText(errors.namespace, MAX_NAMESPACE_LENGTH)}
              required
            />
          )}
        />
      </Box>

      <Section title={t('Server')}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={values.serverType}
          onChange={(_, serverType) => serverType && setServerType(serverType)}
          disabled={disabled}
          aria-label={t('Server type')}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="jupyter">{t('JupyterLab')}</ToggleButton>
          <ToggleButton value="group-one">{t('VS Code')}</ToggleButton>
          <ToggleButton value="group-two">{t('RStudio')}</ToggleButton>
        </ToggleButtonGroup>
        <Autocomplete
          freeSolo
          options={NOTEBOOK_IMAGES[values.serverType]}
          value={values.image}
          onInputChange={(_, image) => set('image', image)}
          disabled={disabled}
          renderInput={params => (
            <TextField
              {...params}
              label={t('Image')}
              error={!!errors.image}
              helperText={errorText(errors.image) || t('Pick a preset or enter a custom image')}
              required
            />
          )}
        />
      </Section>

      <Section title={t('CPU and memory')}>
        <Box sx={twoColumns}>
          <TextField
            label={t('CPU request')}
            value={values.cpu}
            onChange={e => set('cpu', e.target.value)}
            error={!!errors.cpu}
            helperText={errorText(errors.cpu) || t('In cores, e.g. 0.5')}
            disabled={disabled}
            required
          />
          <TextField
            label={t('CPU limit')}
            value={values.cpuLimit}
            placeholder={limitPlaceholder(values.cpu)}
            // Keep the label above the field, so the default limit placeholder is visible.
            InputLabelProps={{ shrink: true }}
            onChange={e => set('cpuLimit', e.target.value)}
            error={!!errors.cpuLimit}
            helperText={errorText(errors.cpuLimit) || t('Empty: 1.2 × the request')}
            disabled={disabled}
          />
          <TextField
            label={t('Memory request (Gi)')}
            value={values.memoryGi}
            onChange={e => set('memoryGi', e.target.value)}
            error={!!errors.memoryGi}
            helperText={errorText(errors.memoryGi)}
            disabled={disabled}
            required
          />
          <TextField
            label={t('Memory limit (Gi)')}
            value={values.memoryLimitGi}
            placeholder={limitPlaceholder(values.memoryGi)}
            InputLabelProps={{ shrink: true }}
            onChange={e => set('memoryLimitGi', e.target.value)}
            error={!!errors.memoryLimitGi}
            helperText={errorText(errors.memoryLimitGi) || t('Empty: 1.2 × the request')}
            disabled={disabled}
          />
        </Box>
      </Section>

      <Section title={t('GPUs')}>
        <Box sx={twoColumns}>
          <TextField
            select
            label={t('Vendor')}
            value={values.gpuVendor}
            onChange={e => set('gpuVendor', e.target.value)}
            disabled={disabled}
            // Show "None" instead of an empty field when no GPU is selected.
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="">{t('None')}</MenuItem>
            {GPU_VENDORS.map(vendor => (
              <MenuItem key={vendor.limitsKey} value={vendor.limitsKey}>
                {vendor.label}
              </MenuItem>
            ))}
          </TextField>
          {values.gpuVendor && (
            <TextField
              label={t('Number of GPUs')}
              value={values.gpuCount}
              onChange={e => set('gpuCount', e.target.value)}
              error={!!errors.gpuCount}
              helperText={errorText(errors.gpuCount)}
              disabled={disabled}
              required
            />
          )}
        </Box>
      </Section>

      <Section title={t('Workspace volume')}>
        <RadioGroup
          row
          aria-label={t('Workspace volume')}
          value={values.workspace.type}
          onChange={e =>
            setWorkspace({ type: e.target.value as NotebookFormValues['workspace']['type'] })
          }
        >
          <FormControlLabel
            value="new"
            control={<Radio />}
            label={t('New volume')}
            disabled={disabled}
          />
          <FormControlLabel
            value="existing"
            control={<Radio />}
            label={t('Existing volume')}
            disabled={disabled}
          />
          <FormControlLabel
            value="none"
            control={<Radio />}
            label={t('None')}
            disabled={disabled}
          />
        </RadioGroup>
        {values.workspace.type === 'none' && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {t('Without a workspace volume, files are lost when the notebook restarts.')}
          </Alert>
        )}
        {values.workspace.type !== 'none' && (
          <Box sx={{ ...twoColumns, mt: 1 }}>
            {values.workspace.type === 'new' ? (
              <TextField
                label={t('Size (Gi)')}
                value={values.workspace.sizeGi}
                onChange={e => setWorkspace({ sizeGi: e.target.value })}
                error={!!errors.workspaceSize}
                helperText={
                  errorText(errors.workspaceSize) ||
                  (values.name
                    ? t('Creates the PVC {{name}}', { name: `${values.name}-workspace` })
                    : undefined)
                }
                disabled={disabled}
                required
              />
            ) : (
              <Autocomplete
                freeSolo
                options={claimNames}
                value={values.workspace.claimName}
                onInputChange={(_, claimName) => setWorkspace({ claimName })}
                disabled={disabled}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('PVC name')}
                    error={!!errors.workspaceClaimName}
                    helperText={errorText(errors.workspaceClaimName)}
                    required
                  />
                )}
              />
            )}
            <TextField
              label={t('Mount path')}
              value={values.workspace.mountPath}
              onChange={e => setWorkspace({ mountPath: e.target.value })}
              error={!!errors.workspaceMountPath}
              helperText={errorText(errors.workspaceMountPath)}
              disabled={disabled}
              required
            />
          </Box>
        )}
      </Section>

      <Section title={t('Configurations')}>
        {podDefaults.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {values.namespace
              ? t('No PodDefaults in this namespace.')
              : t('Select a namespace to see its PodDefaults.')}
          </Typography>
        ) : (
          podDefaults.map(podDefault => (
            <FormControlLabel
              key={podDefault.label}
              sx={{ display: 'flex' }}
              control={
                <Checkbox
                  checked={values.podDefaultLabels.includes(podDefault.label)}
                  onChange={() => togglePodDefault(podDefault.label)}
                  disabled={disabled}
                />
              }
              label={podDefault.description}
            />
          ))
        )}
      </Section>

      <Section title={t('Miscellaneous')}>
        <FormControlLabel
          control={
            <Switch
              checked={values.enableSharedMemory}
              onChange={e => set('enableSharedMemory', e.target.checked)}
              disabled={disabled}
            />
          }
          label={t('Enable shared memory (/dev/shm)')}
        />
      </Section>
    </Box>
  );
}

/**
 * The form, with the PVCs and PodDefaults of the selected namespace. It is only rendered once
 * a namespace is selected, so these lists are never fetched across the whole cluster.
 */
function NamespacedNotebookCreateForm(
  props: Omit<NotebookCreateFormProps, 'claimNames' | 'podDefaults'> & { cluster?: string }
) {
  const { cluster, ...formProps } = props;
  const namespace = props.values.namespace;
  const [claimList] = K8s.ResourceClasses.PersistentVolumeClaim.useList({ namespace, cluster });
  const [podDefaultList] = PodDefaultClass.useList({ namespace, cluster });

  return (
    <NotebookCreateForm
      {...formProps}
      claimNames={(claimList || []).map(pvc => pvc.metadata.name).sort()}
      podDefaults={getPodDefaultOptions(podDefaultList || [])}
    />
  );
}

export interface NotebookCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Dialog that creates a Notebook server (and its workspace PVC) in a selected cluster. */
export function NotebookCreateDialog({ open, onClose }: NotebookCreateDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  // With several clusters selected, useCluster() returns any one of them, so the user picks.
  const selectedClusters = K8s.useSelectedClusters();
  const currentCluster = K8s.useCluster() || undefined;
  const [cluster, setCluster] = React.useState(currentCluster);

  const [values, setValues] = React.useState(() => getDefaultNotebookFormValues());
  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [namespaceList, namespaceError] = K8s.ResourceClasses.Namespace.useList({ cluster });
  const namespaces = (namespaceList || []).map(ns => ns.metadata.name).sort();
  const namespacesLoading = namespaceList === null && !namespaceError;
  const errors = validateNotebookForm(values);

  // The error is shown at the top of the dialog, which may be scrolled out of view.
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (submitError) contentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [submitError]);

  function handleClusterChange(newCluster: string) {
    // Namespaces, PVCs and PodDefaults belong to a cluster, so start the namespace over.
    setCluster(newCluster);
    handleChange({ ...values, namespace: '' });
  }

  function handleClose() {
    if (saving) return;
    setValues(getDefaultNotebookFormValues());
    setShowErrors(false);
    setSubmitError(null);
    onClose();
  }

  function handleChange(newValues: NotebookFormValues) {
    // PodDefaults belong to a namespace, so a namespace change clears the selection.
    const namespaceChanged = newValues.namespace !== values.namespace;
    setValues(namespaceChanged ? { ...newValues, podDefaultLabels: [] } : newValues);
  }

  async function handleCreate() {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    const { notebook, workspacePvc } = buildNotebookObjects(values);
    const pvcEndpoint = K8s.ResourceClasses.PersistentVolumeClaim.apiEndpoint;
    let createdPvc = false;
    try {
      // Like the Kubeflow web app, check that every object can be created before creating
      // any, so a rejected Notebook doesn't leave a new PVC behind.
      await NotebookClass.apiEndpoint.post(notebook, { dryRun: 'All' }, cluster);
      if (workspacePvc) {
        await pvcEndpoint.post(workspacePvc as any, { dryRun: 'All' }, cluster);
        await pvcEndpoint.post(workspacePvc as any, {}, cluster);
        createdPvc = true;
      }
      await NotebookClass.apiEndpoint.post(notebook, {}, cluster);
    } catch (err) {
      if (createdPvc && workspacePvc) {
        // The Notebook failed after its PVC was created. Remove the PVC, or trying again
        // would fail because the PVC already exists. The original error is the one to show.
        const { name, namespace } = workspacePvc.metadata;
        await (pvcEndpoint as any).delete(namespace, name, {}, cluster).catch(() => {});
      }
      setSubmitError((err as Error)?.message || String(err));
      setSaving(false);
      return;
    }

    setSaving(false);
    enqueueSnackbar(t('Created notebook server {{name}}', { name: values.name }), {
      variant: 'success',
    });
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('New Notebook Server')}</DialogTitle>
      <DialogContent dividers ref={contentRef}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('Could not create the notebook server: {{error}}', { error: submitError })}
          </Alert>
        )}
        {selectedClusters.length > 1 && (
          <TextField
            select
            fullWidth
            label={t('Cluster')}
            value={cluster || ''}
            onChange={e => handleClusterChange(e.target.value)}
            disabled={saving}
            sx={{ mb: 2 }}
          >
            {selectedClusters.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {values.namespace ? (
          <NamespacedNotebookCreateForm
            values={values}
            errors={showErrors ? errors : {}}
            onChange={handleChange}
            namespaces={namespaces}
            namespacesLoading={namespacesLoading}
            disabled={saving}
            cluster={cluster}
          />
        ) : (
          <NotebookCreateForm
            values={values}
            errors={showErrors ? errors : {}}
            onChange={handleChange}
            namespaces={namespaces}
            namespacesLoading={namespacesLoading}
            claimNames={[]}
            podDefaults={[]}
            disabled={saving}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {t('Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Header button that opens the {@link NotebookCreateDialog}. */
export function NotebookCreateButton() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Icon icon="mdi:plus" />}
        onClick={() => setOpen(true)}
      >
        {t('New Notebook')}
      </Button>
      {/* Mount only while open, so the list page doesn't fetch namespaces it doesn't need. */}
      {open && <NotebookCreateDialog open onClose={() => setOpen(false)} />}
    </>
  );
}
