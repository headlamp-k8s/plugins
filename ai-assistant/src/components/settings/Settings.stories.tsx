import '@headlamp-k8s/ai-ui/icons/iconBundles';
import type { SavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { SettingsPage } from '@headlamp-k8s/ai-ui/components/settings/SettingsPage';
import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  createDesktopApi,
  createMemoryConfigStore,
} from '../../../packages/ai-ui/src/components/settings/MCPSettings/MCPSettings.stories';
import { SettingsRows, SettingsSection } from './Settings';

const initialConfigs: SavedConfigurations = {
  termsAccepted: true,
  defaultProviderIndex: 0,
  providers: [
    {
      id: 'preview-openai',
      providerId: 'openai',
      displayName: 'OpenAI',
      config: { model: 'gpt-5.6-terra', apiKey: 'preview-only' },
    },
    {
      id: 'preview-local',
      providerId: 'local',
      displayName: 'Local assistant',
      config: { model: 'llama3.1', baseUrl: 'http://localhost:11434' },
    },
  ],
};

/** Interactive preview that installs its isolated bridge before mounting settings. */
export function SettingsPreview() {
  const [bridgeReady, setBridgeReady] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState(initialConfigs);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [diagnosisEnabled, setDiagnosisEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [tools, setTools] = useState<Record<string, boolean>>({ kubernetes: true });
  const [configStore] = useState(() =>
    createMemoryConfigStore({
      mcpConfig: {
        enabled: true,
        servers: [{ name: 'Example server', command: 'preview-only', args: [], enabled: false }],
      },
    })
  );
  useEffect(() => {
    const previousApi = window.desktopApi;
    window.desktopApi = createDesktopApi(configStore);
    setBridgeReady(true);
    return () => {
      window.desktopApi = previousApi;
    };
  }, [configStore]);

  if (!bridgeReady) return null;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <SettingsPage
        SectionWrapper={SettingsSection}
        SettingsTable={SettingsRows}
        savedConfigs={savedConfigs}
        onConfigsChange={setSavedConfigs}
        configStore={configStore}
        isRunningAsApp
        loadSkills={async () => []}
        previewEnabled={previewEnabled}
        onPreviewChange={setPreviewEnabled}
        proactiveDiagnosisEnabled={diagnosisEnabled}
        onProactiveDiagnosisChange={setDiagnosisEnabled}
        isTestMode={testMode}
        onTestModeChange={setTestMode}
        devOptions={{}}
        onDevOptionsChange={() => undefined}
        hasShownConfigPopover
        onResetPopover={() => undefined}
        tools={[
          {
            id: 'kubernetes',
            name: 'Kubernetes API',
            description: 'Read and manage cluster resources.',
          },
          {
            id: 'commands',
            name: 'Command execution',
            description: 'Run commands after your approval.',
          },
        ]}
        isToolEnabled={id => tools[id] ?? false}
        onToolToggle={id => setTools(current => ({ ...current, [id]: !current[id] }))}
      />
    </Box>
  );
}

export default {
  title: 'Settings/AI Assistant',
  component: SettingsPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Uses an in-memory desktop bridge. No commands are executed or app settings changed.',
      },
    },
  },
} satisfies Meta<typeof SettingsPreview>;

export const SettingsLayout: StoryObj<typeof SettingsPreview> = {};
