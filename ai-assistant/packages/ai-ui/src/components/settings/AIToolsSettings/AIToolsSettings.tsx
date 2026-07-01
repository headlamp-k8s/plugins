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
import { DefaultSectionWrapper } from '../../defaults/DefaultSlots/DefaultSlots';

/** Describes a single AI tool that can be enabled or disabled. */
export interface ToolInfo {
  /** Unique identifier for the tool. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Brief description of what the tool does. */
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
 * Renders a list of AI tools with toggle switches.
 *
 * Each tool is displayed with its name and description, and a switch
 * to enable/disable it.
 */
export function AIToolsSettings({
  tools,
  isToolEnabled,
  onToolToggle,
  SectionWrapper = DefaultSectionWrapper,
}: AIToolsSettingsProps) {
  const { t } = useTranslation();
  return (
    <SectionWrapper title={t('AI Tools')}>
      <Box>
        {tools.map(tool => (
          <Box key={tool.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isToolEnabled(tool.id)}
                  onChange={() => onToolToggle(tool.id)}
                  color="primary"
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
        ))}
      </Box>
    </SectionWrapper>
  );
}

export default AIToolsSettings;
