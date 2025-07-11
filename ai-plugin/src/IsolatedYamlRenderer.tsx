import { ThemeProvider } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import YamlDisplay from './components/YamlDisplay';

interface IsolatedYamlRendererProps {
  yaml: string;
  resourceType: string;
  theme: Theme;
  onYamlDetected: (yaml: string, resourceType: string) => void;
}

/**
 * IsolatedYamlRenderer uses React Portals and imperative rendering to completely
 * isolate the YAML editor from any parent re-renders. This ensures that the
 * Monaco Editor state (selection, cursor position, etc.) is preserved.
 */
const IsolatedYamlRenderer: React.FC<IsolatedYamlRendererProps> = memo(
  ({ yaml, resourceType, theme, onYamlDetected }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<Root | null>(null);
    const lastYamlRef = useRef<string>('');
    const lastResourceTypeRef = useRef<string>('');

    // Imperative render function that updates the isolated React tree
    const renderYaml = useCallback(() => {
      if (!containerRef.current) return;

      // Only create root once
      if (!rootRef.current) {
        rootRef.current = createRoot(containerRef.current);
      }

      // Render YamlDisplay in an isolated React tree with ThemeProvider
      rootRef.current.render(
        <ThemeProvider theme={theme}>
          <YamlDisplay yaml={yaml} title={resourceType} onOpenInEditor={onYamlDetected} />
        </ThemeProvider>
      );

      lastYamlRef.current = yaml;
      lastResourceTypeRef.current = resourceType;
    }, [yaml, resourceType, theme, onYamlDetected]);

    // Only re-render if YAML content or resource type actually changed
    useEffect(() => {
      if (yaml !== lastYamlRef.current || resourceType !== lastResourceTypeRef.current) {
        renderYaml();
      }
    }, [yaml, resourceType, renderYaml]);

    // Initial render
    useEffect(() => {
      renderYaml();
    }, [renderYaml]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }
      };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: 'auto' }} />;
  },
  (prevProps, nextProps) => {
    // Only re-render this component if the actual YAML content or resource type changed
    return (
      prevProps.yaml === nextProps.yaml &&
      prevProps.resourceType === nextProps.resourceType &&
      prevProps.theme === nextProps.theme &&
      prevProps.onYamlDetected === nextProps.onYamlDetected
    );
  }
);

IsolatedYamlRenderer.displayName = 'IsolatedYamlRenderer';

export default IsolatedYamlRenderer;
