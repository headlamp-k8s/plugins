import Editor from '@monaco-editor/react';
import React from 'react';
import YAML from 'yaml';

export interface YamlViewerProps {
  value: unknown;
  /** Accessible name for the editor, announced by screen readers. */
  ariaLabel: string;
  height?: number;
  lineNumbers?: boolean;
}

/** Read-only Monaco editor that keeps Tab for focus navigation instead of trapping it. */
export default function YamlViewer(props: YamlViewerProps) {
  const { value, ariaLabel, height = 200, lineNumbers = true } = props;
  const themeName = localStorage.getItem('headlampThemePreference');

  return (
    <Editor
      language="yaml"
      value={YAML.stringify(value)}
      height={height}
      theme={themeName === 'dark' ? 'vs-dark' : 'light'}
      options={{
        // On Monaco <=0.52 the tabFocusMode option is ignored, but Tab/Shift+Tab still move focus
        // because their keybindings require a writable editor. Newer Monaco honours tabFocusMode.
        readOnly: true,
        domReadOnly: true,
        tabFocusMode: true,
        ariaLabel,
        lineNumbers: lineNumbers ? 'on' : 'off',
      }}
    />
  );
}
