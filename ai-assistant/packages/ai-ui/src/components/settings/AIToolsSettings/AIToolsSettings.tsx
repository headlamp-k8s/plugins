/**
 * Settings section for toggling individual AI tools on/off.
 *
 * Framework-agnostic: uses only MUI components and accepts tool
 * definitions via props so the host application can inject its
 * own tool list.
 */

import { Box, Switch, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DefaultSectionWrapper,
  DefaultSettingsTable,
  type DefaultSettingsTableProps,
} from '../../defaults/DefaultSlots/DefaultSlots';

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
  /** Optional host settings table for aligned labels and controls. */
  SettingsTable?: React.ComponentType<DefaultSettingsTableProps>;
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
  SectionWrapper = DefaultSectionWrapper,
  SettingsTable = DefaultSettingsTable,
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
          <SettingsTable
            rows={tools.map(tool => ({
              name: (
                <Box>
                  <Typography variant="body1">{tool.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </Box>
              ),
              value: (
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
              ),
            }))}
          />
        )}
      </Box>
    </SectionWrapper>
  );
}

export default AIToolsSettings;
