import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import YamlViewer from './YamlViewer';

const editorProps = vi.hoisted(() => ({ current: null as any }));

vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    editorProps.current = props;
    return null;
  },
}));

describe('YamlViewer', () => {
  it('renders a read-only, labelled editor that lets Tab move focus out', () => {
    render(<YamlViewer value={{ a: 1 }} ariaLabel="Values (read-only)" />);

    expect(editorProps.current.value).toBe('a: 1\n');
    expect(editorProps.current.options).toMatchObject({
      readOnly: true,
      domReadOnly: true,
      tabFocusMode: true,
      ariaLabel: 'Values (read-only)',
    });
  });
});
