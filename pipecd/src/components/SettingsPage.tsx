import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormHelperText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import type { PipeCDConfig } from '../api/pipecd';
import { isConfigured, listApplications, loadConfig, saveConfig } from '../api/pipecd';

interface TestResult {
  ok: boolean;
  count?: number;
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

function renderTestResultMessage(result: TestResult): string {
  if (result.ok) {
    return `Connection successful — ${result.count ?? 0} application(s) returned.`;
  }
  return `Connection failed: ${result.error ?? 'Unknown error'}`;
}

export function SettingsPage(): JSX.Element {
  const saved = loadConfig();

  const [baseURL, setBaseURL] = useState(saved.baseURL);
  const [apiKey, setApiKey] = useState(saved.apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saved_, setSaved] = useState(false);
  const testedConfig = useRef<{ baseURL: string; apiKey: string } | null>(null);

  const config: PipeCDConfig = { baseURL, apiKey };

  const handleSave = (): void => {
    saveConfig(config);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async (): Promise<void> => {
    // The fields stay editable while the request is in flight, so remember what
    // was tested and drop the result if the configuration moved on.
    const tested = { baseURL, apiKey };
    testedConfig.current = tested;

    setTesting(true);
    setTestResult(null);
    try {
      const result = await listApplications(config);
      if (testedConfig.current !== tested) return;
      setTestResult({ ok: true, count: result.applications?.length ?? 0 });
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
  const hasChanges = baseURL !== saved.baseURL || apiKey !== saved.apiKey;

  return (
    <Box sx={{ maxWidth: 640, py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        PipeCD Plugin Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Connect this Headlamp plugin to your PipeCD Control Plane. You need a PipeCD API key with at
        minimum the <strong>READ_ONLY</strong> role.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <TextField
              fullWidth
              id="pipecd-base-url"
              label="PipeCD Server URL"
              placeholder="https://pipecd.example.com"
              value={baseURL}
              onChange={e => {
                setBaseURL(e.target.value);
                setTestResult(null);
                testedConfig.current = null;
              }}
              error={!urlValid}
            />
            {!urlValid && (
              <FormHelperText error>
                Use an https:// URL. http:// is only allowed for localhost.
              </FormHelperText>
            )}
            <FormHelperText>
              Base URL of your PipeCD Control Plane gateway. No trailing slash.
            </FormHelperText>
          </Box>

          <Box>
            <TextField
              fullWidth
              id="pipecd-api-key"
              label="API Key"
              type="password"
              placeholder="Enter PipeCD API key"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                setTestResult(null);
                testedConfig.current = null;
              }}
            />
            <FormHelperText>
              Generate one in the PipeCD UI under Settings → API Keys.
            </FormHelperText>
          </Box>

          <Divider />

          {testResult !== null && (
            <Alert severity={testResult.ok ? 'success' : 'error'} icon={undefined}>
              {renderTestResultMessage(testResult)}
            </Alert>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isConfigured(config) || !urlValid || !hasChanges}
              color={saved_ ? 'success' : 'primary'}
              startIcon={undefined}
            >
              {saved_ ? 'Saved!' : 'Save Settings'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                void handleTest();
              }}
              disabled={!isConfigured(config) || !urlValid || testing}
              startIcon={testing ? <CircularProgress size={16} /> : undefined}
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
