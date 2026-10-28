/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { PipeCDConfig } from '../api/pipecd';
import { isConfigured, listApplications, loadConfig, saveConfig } from '../api/pipecd';

interface TestResult {
  ok: boolean;
  error?: string;
}

/**
 * The API key travels in a request header, so plain HTTP would expose it.
 * Loopback is allowed so the plugin can be pointed at a local control plane
 * during development.
 */
function isSecureURL(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === 'https:') return true;
  if (url.protocol !== 'http:') return false;
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
}

/**
 * Console links are built as `${baseURL}/applications/...`, so surrounding
 * whitespace or a trailing slash would produce a broken path.
 *
 * A valid URL is stored in its parsed form. `http:localhost:8080` passes
 * `new URL()`, but the browser resolves that raw string against Headlamp's own
 * origin, which would send the API key to the Headlamp host instead.
 */
function normalizeBaseURL(value: string): string {
  const trimmed = value.trim();
  let url = trimmed;
  try {
    url = new URL(trimmed).href;
  } catch {
    // Left as typed; isSecureURL rejects it, so it is never saved or used.
  }
  return url.replace(/\/+$/, '');
}

export function SettingsPage(): JSX.Element {
  const { t } = useTranslation();
  const saved = loadConfig();

  const [baseURL, setBaseURL] = useState(saved.baseURL);
  const [apiKey, setApiKey] = useState(saved.apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saved_, setSaved] = useState(false);
  const testedConfig = useRef<{ baseURL: string; apiKey: string } | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>();

  // Clear the "Saved!" timer if the page is left before it fires.
  useEffect(() => () => clearTimeout(savedTimer.current), []);

  // A pasted key often carries a trailing space or newline, which PipeCD then
  // rejects as an invalid key.
  const config: PipeCDConfig = { baseURL: normalizeBaseURL(baseURL), apiKey: apiKey.trim() };

  const renderTestResultMessage = (result: TestResult): string => {
    // No application count: the response is only the first page, so a count
    // would be too low for anyone with more applications than one page holds.
    if (result.ok) return t('Connection successful.');
    const error = result.error ?? t('Unknown error');
    return t('Connection failed: {{error}}', { error });
  };

  const handleSave = (): void => {
    saveConfig(config);
    setBaseURL(config.baseURL);
    setApiKey(config.apiKey);
    setSaved(true);
    setTestResult(null);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async (): Promise<void> => {
    // The fields stay editable while the request is in flight, so remember what
    // was tested and drop the result if the configuration moved on.
    const tested = { baseURL, apiKey };
    testedConfig.current = tested;

    setTesting(true);
    setTestResult(null);
    try {
      // One application is enough to prove the key works. With no limit
      // PipeCD returns every application in the project.
      await listApplications(config, { pageSize: 1 });
      if (testedConfig.current !== tested) return;
      setTestResult({ ok: true });
    } catch (err) {
      if (testedConfig.current !== tested) return;
      setTestResult({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      if (testedConfig.current === tested) setTesting(false);
    }
  };

  const urlValid = baseURL === '' || isSecureURL(baseURL);
  const hasChanges = config.baseURL !== saved.baseURL || config.apiKey !== saved.apiKey;

  return (
    <Box sx={{ maxWidth: 640, py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('PipeCD Plugin Settings')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t(
          'Connect this Headlamp plugin to your PipeCD Control Plane. You need a PipeCD API key with at minimum the {{role}} role.',
          { role: 'READ_ONLY' }
        )}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('The API key is kept in memory only. Re-enter it after reloading or closing Headlamp.')}
      </Alert>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <TextField
              fullWidth
              id="pipecd-base-url"
              label={t('PipeCD Server URL')}
              placeholder="https://pipecd.example.com"
              value={baseURL}
              onChange={e => {
                setBaseURL(e.target.value);
                setTestResult(null);
                testedConfig.current = null;
                setTesting(false);
              }}
              error={!urlValid}
              helperText={
                urlValid
                  ? t('Base URL of your PipeCD Control Plane gateway.')
                  : t('Use an https:// URL. http:// is only allowed for localhost.')
              }
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              id="pipecd-api-key"
              label={t('API Key')}
              type="password"
              placeholder={t('Enter PipeCD API key')}
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                setTestResult(null);
                testedConfig.current = null;
                setTesting(false);
              }}
              helperText={t('Generate one in the PipeCD UI under Settings → API Keys.')}
            />
          </Box>

          <Divider />

          {testResult !== null && (
            <Alert severity={testResult.ok ? 'success' : 'error'}>
              {renderTestResultMessage(testResult)}
            </Alert>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              // Incomplete or empty fields can still be saved, so stored
              // credentials can be cleared.
              disabled={!urlValid || !hasChanges}
              color={saved_ ? 'success' : 'primary'}
            >
              {saved_ ? t('Saved!') : t('Save Settings')}
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                void handleTest();
              }}
              disabled={!isConfigured(config) || !urlValid || testing}
              startIcon={testing ? <CircularProgress size={16} /> : undefined}
            >
              {testing ? t('Testing…') : t('Test Connection')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
