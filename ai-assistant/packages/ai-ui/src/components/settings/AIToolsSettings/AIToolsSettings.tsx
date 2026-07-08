/**
 * Settings section for toggling individual AI tools on/off.
 *
 * Framework-agnostic: uses only MUI components and accepts tool
 * definitions via props so the host application can inject its
 * own tool list.
 */

import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Describes a single AI tool that can be enabled or disabled. */
export interface ToolInfo {
  /** Unique identifier for the tool. */
  id: string;
  /** Human-readable display name, localized by the host before it is passed here. */
  name: string;
  /** Brief description, localized by the host before it is passed here. */
  description: string;
}

/** Props for the {@link AIToolsSettings} component. */
export interface AIToolsSettingsProps {
  /** Available tools to display. */
  tools: ToolInfo[];
  /** Returns whether the given tool is currently enabled. */
  isToolEnabled: (toolId: string) => boolean;
  /** Callback invoked when the user toggles a tool. */
  onToolToggle: (toolId: string) => void;
  /** Optional wrapper component for layout. Falls back to a simple Box with title. */
  SectionWrapper?: React.ComponentType<{ title: string; children: React.ReactNode }>;
}

/**
 * Standalone MUI section used when the host does not provide a wrapper.
 *
 * @param props - Section title and content.
 * @returns Titled settings section.
 */
function DefaultToolsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * Renders a list of AI tools with toggle switches.
 *
 * Each tool is displayed with its name and description, and a switch
 * to enable/disable it.
 *
 * @param props - Tool definitions, state callbacks, and optional section wrapper.
 * @returns Tool-toggle settings section.
 */
export function AIToolsSettings({
  tools,
  isToolEnabled,
  onToolToggle,
  SectionWrapper = DefaultToolsSection,
}: AIToolsSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <SectionWrapper title={t('AI Tools')}>
      <Box>
        {tools.length === 0 ? (
          <Typography color="text.secondary" sx={{ ml: 2 }}>
            {t('No AI tools available.')}
          </Typography>
        ) : (
          tools.map(tool => (
            <Box key={tool.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isToolEnabled(tool.id)}
                    onChange={() => onToolToggle(tool.id)}
                    color="primary"
                    inputProps={{
                      'aria-label': t('Enable or disable {{toolName}}', {
                        toolName: tool.name,
                      }),
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">{tool.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tool.description}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          ))
        )}
      </Box>
    </SectionWrapper>
  );
}

export default AIToolsSettings;
