import React, { useRef, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import ContentRenderer from './ContentRenderer';

interface StableContentProps {
  content: string;
  onYamlDetected?: (yaml: string, resourceType: string) => void;
  theme: Theme;
}

// This component renders content in a way that prevents re-renders from affecting Monaco Editor
const StableContentRenderer: React.FC<StableContentProps> = ({ content, onYamlDetected, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);
  const lastContentRef = useRef<string>('');
  const lastCallbackRef = useRef<((yaml: string, resourceType: string) => void) | undefined>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Only update if content or callback actually changed
    if (content === lastContentRef.current && onYamlDetected === lastCallbackRef.current) {
      return;
    }

    // Clean up previous root if it exists
    if (rootRef.current) {
      rootRef.current.unmount();
    }

    // Create new root and render
    rootRef.current = createRoot(containerRef.current);
    rootRef.current.render(
      <ThemeProvider theme={theme}>
        <ContentRenderer
          content={content}
          onYamlDetected={onYamlDetected}
        />
      </ThemeProvider>
    );

    lastContentRef.current = content;
    lastCallbackRef.current = onYamlDetected;

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [content, onYamlDetected, theme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%' }} />;
};

export default StableContentRenderer;
