import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import React, { useCallback, useMemo } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import YamlDisplay from './components/YamlDisplay';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';

interface ImperativeContentRendererProps {
  content: string;
  onYamlDetected?: (yaml: string, resourceType: string) => void;
}

/**
 * ImperativeContentRenderer uses imperative DOM manipulation to render YAML
 * components outside of React's reconciliation cycle, preventing re-renders
 * from affecting Monaco Editor state.
 */
const ImperativeContentRenderer: React.FC<ImperativeContentRendererProps> = ({
  content,
  onYamlDetected,
}) => {
  const theme = useTheme();

  // Cache for rendered YAML containers to prevent duplicate rendering
  const yamlContainers = useMemo(
    () => new Map<string, { container: HTMLDivElement; root: Root }>(),
    []
  );

  // Cleanup function for YAML containers
  const cleanupYamlContainers = useCallback(() => {
    yamlContainers.forEach(({ root }) => {
      root.unmount();
    });
    yamlContainers.clear();
  }, [yamlContainers]);

  // Imperative YAML renderer
  const renderYamlImperatively = useCallback(
    (yaml: string, resourceType: string, containerId: string) => {
      // Check if we already have this exact YAML rendered
      if (yamlContainers.has(containerId)) {
        return yamlContainers.get(containerId)!.container;
      }

      // Create new container
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.margin = '16px 0';

      const root = createRoot(container);

      // Render YAML component imperatively
      root.render(
        <ThemeProvider theme={theme}>
          <YamlDisplay
            yaml={yaml}
            title={resourceType}
            onOpenInEditor={onYamlDetected || (() => {})}
          />
        </ThemeProvider>
      );

      // Cache the container
      yamlContainers.set(containerId, { container, root });

      return container;
    },
    [theme, onYamlDetected, yamlContainers]
  );

  // Custom markdown components with imperative YAML rendering
  const markdownComponents = useMemo(
    () => ({
      h1: ({ ...props }: any) => (
        <Typography variant="h4" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
      ),
      h2: ({ ...props }: any) => (
        <Typography variant="h5" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
      ),
      h3: ({ ...props }: any) => (
        <Typography variant="h6" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
      ),
      p: ({ ...props }: any) => (
        <Typography variant="body1" paragraph sx={{ overflowWrap: 'break-word' }} {...props} />
      ),
      code: ({ className, children, ...props }: any) => {
        const isYamlBlock =
          !props.inline &&
          (className === 'language-yaml' ||
            className === 'language-yml' ||
            (typeof children === 'string' &&
              children.includes('apiVersion:') &&
              children.includes('kind:')));

        if (isYamlBlock && onYamlDetected && typeof children === 'string') {
          const parsed = parseKubernetesYAML(children);
          if (parsed.isValid) {
            // Use a ref callback to imperatively inject the YAML component
            return (
              <div
                ref={element => {
                  if (element && !element.hasChildNodes()) {
                    const yamlId = `yaml-${Date.now()}-${Math.random()}`;
                    const yamlContainer = renderYamlImperatively(
                      children,
                      parsed.resourceType,
                      yamlId
                    );
                    element.appendChild(yamlContainer);
                  }
                }}
              />
            );
          }
        }

        // Regular code block styling
        return !props.inline ? (
          <Box
            component="pre"
            sx={{
              backgroundColor: theme => theme.palette.grey[100],
              color: theme => theme.palette.grey[900],
              padding: 2,
              borderRadius: 1,
              overflowX: 'auto',
              '& code': {
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              },
            }}
          >
            <Box component="code" className={className} {...props}>
              {children}
            </Box>
          </Box>
        ) : (
          <Box
            component="code"
            sx={{
              backgroundColor: theme => theme.palette.grey[100],
              color: theme => theme.palette.grey[900],
              padding: '0.1em 0.3em',
              borderRadius: '0.3em',
              fontSize: '85%',
              wordWrap: 'break-word',
            }}
            className={className}
            {...props}
          >
            {children}
          </Box>
        );
      },
      table: ({ ...props }: any) => (
        <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
          <Box
            component="table"
            sx={{ minWidth: '400px', borderCollapse: 'collapse' }}
            {...props}
          />
        </Box>
      ),
      th: ({ ...props }: any) => (
        <Box
          component="th"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            padding: 1,
            backgroundColor: 'grey.100',
            fontWeight: 'bold',
            textAlign: 'left',
          }}
          {...props}
        />
      ),
      td: ({ ...props }: any) => (
        <Box
          component="td"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            padding: 1,
          }}
          {...props}
        />
      ),
    }),
    [onYamlDetected, renderYamlImperatively]
  );

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      cleanupYamlContainers();
    };
  }, [cleanupYamlContainers]);

  return (
    <Box sx={{ width: '100%', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default React.memo(ImperativeContentRenderer, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content && prevProps.onYamlDetected === nextProps.onYamlDetected
  );
});
