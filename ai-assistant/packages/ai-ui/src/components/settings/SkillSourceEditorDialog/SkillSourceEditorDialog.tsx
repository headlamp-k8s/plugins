/**
 * Dialog for adding or editing a skill source (local path or GitHub repo).
 *
 * Validates Git URLs against an allowlist of known hosts and ensures
 * filesystem paths are non-empty.
 */

import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
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
  /** URLs of existing sources, used for duplicate detection. */
  existingUrls: string[];
  /** Component used to render the dialog shell. */
  DialogSlot?: React.ElementType;
}

/**
 * Validates that a URL is a supported Git host.
 *
 * @param url - The URL to validate.
 * @returns True if the URL points to github.com, gitlab.com, or bitbucket.org over HTTPS.
 */
function isValidGitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];
    return allowedHosts.some(
      host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Dialog for adding or editing a skill source.
 *
 * Shows a form with fields appropriate for the source type (local or git),
 * validates inputs, and calls onSave when the user confirms.
 */
export default function SkillSourceEditorDialog({
  open,
  onClose,
  source,
  onSave,
  existingUrls,
  DialogSlot = DefaultDialog,
}: SkillSourceEditorDialogProps) {
  const { t } = useTranslation();
  const isEditing = source !== undefined && source.url !== '';
  const [type, setType] = useState<'local' | 'git'>(source?.type || 'local');
  const [url, setUrl] = useState(source?.url || '');
  const [ref, setRef] = useState(source?.ref || '');
  const [path, setPath] = useState(source?.path || '');
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [sha256, setSha256] = useState(source?.sha256 || '');
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (open && source) {
      setType(source.type);
      setUrl(source.url);
      setRef(source.ref || '');
      setPath(source.path || '');
      setEnabled(source.enabled);
      setSha256(source.sha256 || '');
      setUrlError('');
    }
  }, [open, source]);

  const validateUrl = (value: string): string => {
    if (!value.trim()) {
      return type === 'local' ? t('Path is required') : t('URL is required');
    }
    if (type === 'git' && !isValidGitUrl(value)) {
      return t('Must be an HTTPS URL to github.com, gitlab.com, or bitbucket.org');
    }
    if (!isEditing && existingUrls.includes(value)) {
      return t('This source already exists');
    }
    return '';
  };

  const handleSave = () => {
    const error = validateUrl(url);
    if (error) {
      setUrlError(error);
      return;
    }
    const entry: SkillSourceEntry = {
      type,
      url: url.trim(),
      enabled,
    };
    if (type === 'git') {
      if (ref.trim()) entry.ref = ref.trim();
      if (path.trim()) entry.path = path.trim();
      if (sha256.trim()) entry.sha256 = sha256.trim();
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
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Source Type
            </Typography>
            <RadioGroup
              row
              value={type}
              onChange={e => {
                setType(e.target.value as 'local' | 'git');
                setUrl('');
                setUrlError('');
              }}
            >
              <FormControlLabel
                value="local"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:folder" />
                    <span>{t('Filesystem')}</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="git"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon icon="mdi:github" />
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
                ? 'Absolute path to a directory containing skill files'
                : 'HTTPS URL to a GitHub, GitLab, or Bitbucket repository')
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
                placeholder={t('main')}
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
                placeholder={t('skills/')}
                helperText={t('Optional subdirectory within the repository to scan')}
                fullWidth
                size="small"
              />
              <TextField
                label={t('SHA-256 Integrity Hash')}
                value={sha256}
                onChange={e => setSha256(e.target.value)}
                placeholder={t('Optional')}
                helperText={t('Expected hash of downloaded content for integrity verification')}
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
