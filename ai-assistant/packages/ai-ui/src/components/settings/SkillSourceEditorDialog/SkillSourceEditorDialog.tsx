/**
 * Dialog for adding or editing a skill source (local path or GitHub repo).
 *
 * Validates Git URLs against an allowlist of known hosts and ensures
 * filesystem paths are non-empty.
 */

import {
  getSkillSourceIdentity,
  isValidSkillSourceGitUrl,
  normalizeSkillSourcePath,
  normalizeSkillSourceUrl,
} from '@headlamp-k8s/ai-common/skills/config';
import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';
import type { SkillSourceEntry } from '../SkillSettings/SkillSettings';

/** Props for the SkillSourceEditorDialog component. */
export interface SkillSourceEditorDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Source being edited, or undefined for a new source. */
  source?: SkillSourceEntry;
  /** Called with the new/updated source when Save is clicked. */
  onSave: (source: SkillSourceEntry) => void;
  /** Existing sources used for complete type, URL, and subdirectory duplicate detection. */
  existingSources: SkillSourceEntry[];
  /** Whether local filesystem sources can be selected in this host. */
  allowLocalSources: boolean;
  /** Component used to render the dialog shell. */
  DialogSlot?: React.ElementType;
}

/**
 * Dialog for adding or editing a skill source.
 *
 * Shows a form with fields appropriate for the source type (local or git),
 * validates inputs, and calls onSave when the user confirms.
 *
 * @param props - Dialog state, source, existing identities, callbacks, and dialog slot.
 * @returns Skill source editor dialog.
 */
export default function SkillSourceEditorDialog({
  open,
  onClose,
  source,
  onSave,
  existingSources,
  allowLocalSources,
  DialogSlot = DefaultDialog,
}: SkillSourceEditorDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const isEditing = source !== undefined && source.url !== '';
  const [type, setType] = useState<'local' | 'git'>(
    source?.type || (allowLocalSources ? 'local' : 'git')
  );
  const [url, setUrl] = useState(source?.url || '');
  const [ref, setRef] = useState(source?.ref || '');
  const [path, setPath] = useState(source?.path || '');
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [sha256, setSha256] = useState(source?.sha256 || '');
  const [urlError, setUrlError] = useState('');
  const [sha256Error, setSha256Error] = useState('');
  const sourceTypeLabelId = React.useId();

  useEffect(() => {
    if (open) {
      setType(source?.type || (allowLocalSources ? 'local' : 'git'));
      setUrl(source?.url || '');
      setRef(source?.ref || '');
      setPath(source?.path || '');
      setEnabled(source?.enabled ?? true);
      setSha256(source?.sha256 || '');
      setUrlError('');
      setSha256Error('');
    }
  }, [allowLocalSources, open, source]);

  /** @returns Translated source validation failure, or an empty string when valid. */
  const validateUrl = (value: string): string => {
    const normalizedValue = normalizeSkillSourceUrl(value, type);
    if (!normalizedValue) {
      return type === 'local' ? t('Path is required') : t('URL is required');
    }
    if (
      type === 'local' &&
      !normalizedValue.startsWith('/') &&
      !/^[A-Za-z]:[\\/]/.test(normalizedValue)
    ) {
      return t('Path must be absolute');
    }
    if (type === 'git' && !isValidSkillSourceGitUrl(value.trim())) {
      return t('Must be an HTTPS GitHub repository URL');
    }
    const candidateIdentity = getSkillSourceIdentity({ type, url: normalizedValue, path });
    const originalIdentity = source ? getSkillSourceIdentity(source) : undefined;
    if (
      existingSources.some(existingSource => {
        const existingIdentity = getSkillSourceIdentity(existingSource);
        return existingIdentity === candidateIdentity && existingIdentity !== originalIdentity;
      })
    ) {
      return t('This source already exists');
    }
    return '';
  };

  /** Validates and emits a normalized source. @returns No value. */
  const handleSave = (): void => {
    const nextSha256Error =
      type === 'git' && sha256.trim() && !/^[a-fA-F0-9]{64}$/.test(sha256.trim())
        ? t('SHA-256 integrity hash must contain 64 hexadecimal characters')
        : '';
    setSha256Error(nextSha256Error);
    const error = validateUrl(url);
    if (error || nextSha256Error) {
      setUrlError(error);
      return;
    }
    const entry: SkillSourceEntry = {
      type,
      url: normalizeSkillSourceUrl(url, type),
      enabled,
    };
    if (type === 'git') {
      if (ref.trim()) entry.ref = ref.trim();
      const normalizedPath = normalizeSkillSourcePath(path);
      if (normalizedPath) entry.path = normalizedPath;
      if (sha256.trim()) entry.sha256 = sha256.trim().toLowerCase();
    }
    onSave(entry);
  };

  return (
    <DialogSlot open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? t('Edit Skill Source') : t('Add Skill Source')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Source type selector */}
          <FormControl>
            <FormLabel id={sourceTypeLabelId} component="legend">
              {t('Source Type')}
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby={sourceTypeLabelId}
              value={type}
              onChange={event => {
                const nextType = event.target.value === 'git' ? 'git' : 'local';
                setType(nextType);
                setUrl('');
                if (nextType === 'local') {
                  setRef('');
                  setPath('');
                  setSha256('');
                }
                setUrlError('');
                setSha256Error('');
              }}
            >
              {allowLocalSources && (
                <FormControlLabel
                  value="local"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Icon icon="mdi:folder" aria-hidden="true" />
                      <span>{t('Filesystem')}</span>
                    </Box>
                  }
                />
              )}
              <FormControlLabel
                value="git"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:github" aria-hidden="true" />
                    <span>{t('GitHub Repository')}</span>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {/* URL / Path field */}
          <TextField
            label={type === 'local' ? t('Directory Path') : t('Repository URL')}
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              setUrlError('');
            }}
            placeholder={type === 'local' ? '/path/to/skills' : 'https://github.com/owner/repo'}
            error={!!urlError}
            helperText={
              urlError ||
              (type === 'local'
                ? t('Absolute path to a directory containing skill files')
                : t('HTTPS URL to a GitHub repository'))
            }
            fullWidth
            size="small"
          />

          {/* Git-specific fields */}
          {type === 'git' && (
            <>
              <TextField
                label={t('Ref (branch, tag, or SHA)')}
                value={ref}
                onChange={e => setRef(e.target.value)}
                placeholder="main"
                helperText={t(
                  'Leave empty for default branch (main). Use a tag or SHA for pinned versions.'
                )}
                fullWidth
                size="small"
              />
              <TextField
                label={t('Subdirectory')}
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="skills/"
                helperText={t('Optional subdirectory within the repository to scan')}
                fullWidth
                size="small"
              />
              <TextField
                label={t('SHA-256 Integrity Hash')}
                value={sha256}
                onChange={e => {
                  setSha256(e.target.value);
                  setSha256Error('');
                }}
                placeholder={t('Optional')}
                error={!!sha256Error}
                helperText={
                  sha256Error || t('Expected hash of downloaded content for integrity verification')
                }
                fullWidth
                size="small"
              />
            </>
          )}

          {/* Enabled toggle */}
          <FormControlLabel
            control={
              <Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} size="small" />
            }
            label={t('Enabled')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {isEditing ? t('Save') : t('Add')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}
