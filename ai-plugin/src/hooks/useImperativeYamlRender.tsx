import { useEffect, useRef, useCallback } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import YamlDisplay from '../components/YamlDisplay';

interface UseImperativeYamlRenderOptions {
  theme: Theme;
  onYamlDetected: (yaml: string, resourceType: string) => void;
}

/**
 * Custom hook that provides imperative YAML rendering capabilities.
 * This completely bypasses React's re-rendering cycle for YAML editors,
 * ensuring that Monaco Editor state is preserved.
 */
export const useImperativeYamlRender = ({ theme, onYamlDetected }: UseImperativeYamlRenderOptions) => {
  const containerRegistry = useRef<Map<string, { container: HTMLDivElement; root: Root }>>(new Map());
  const lastContentRegistry = useRef<Map<string, { yaml: string; resourceType: string }>>(new Map());

  const renderYamlImperatively = useCallback((
    containerId: string,
    yaml: string,
    resourceType: string
  ): HTMLDivElement => {
    const lastContent = lastContentRegistry.current.get(containerId);

    // Check if content actually changed
    if (lastContent && lastContent.yaml === yaml && lastContent.resourceType === resourceType) {
      // Return existing container without re-rendering
      const existing = containerRegistry.current.get(containerId);
      if (existing) {
        return existing.container;
      }
    }

    // Get or create container
    let entry = containerRegistry.current.get(containerId);
    if (!entry) {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = 'auto';
      const root = createRoot(container);
      entry = { container, root };
      containerRegistry.current.set(containerId, entry);
    }

    // Render with new content
    entry.root.render(
      <ThemeProvider theme={theme}>
        <YamlDisplay
          yaml={yaml}
          title={resourceType}
          onOpenInEditor={onYamlDetected}
        />
      </ThemeProvider>
    );

    // Update content registry
    lastContentRegistry.current.set(containerId, { yaml, resourceType });

    return entry.container;
  }, [theme, onYamlDetected]);

  const cleanupContainer = useCallback((containerId: string) => {
    const entry = containerRegistry.current.get(containerId);
    if (entry) {
      entry.root.unmount();
      containerRegistry.current.delete(containerId);
      lastContentRegistry.current.delete(containerId);
    }
  }, []);

  const cleanupAllContainers = useCallback(() => {
    containerRegistry.current.forEach((entry, id) => {
      entry.root.unmount();
    });
    containerRegistry.current.clear();
    lastContentRegistry.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllContainers();
    };
  }, [cleanupAllContainers]);

  return {
    renderYamlImperatively,
    cleanupContainer,
    cleanupAllContainers,
  };
};
