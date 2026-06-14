import { Box } from '@mui/material';
import React from 'react';
import { PromptWidthProvider } from '../../../contexts/PromptWidthContext/PromptWidthContext';

/** Props for the AIPanelComponent. */
export interface AIPanelComponentProps {
  /** Whether the AI panel is open. */
  isOpen: boolean;
  /** Optional React node rendered when `hasValidConfig` is true (e.g. cluster change notifier). */
  clusterNotifier?: React.ReactNode;
  /** Whether a valid provider configuration exists. */
  hasValidConfig: boolean;
  /** The panel content (e.g. the AI prompt component). */
  children: React.ReactNode;
}

/**
 * Resizable side panel for the AI Assistant.
 *
 * Renders a panel on the right side of the viewport that supports mouse-drag
 * resizing between 300 px and 80 % of the viewport width. The panel wraps its
 * children in a {@link PromptWidthProvider} so descendants can read the current
 * width.
 *
 * All headlamp-plugin dependencies (global state, config store, cluster
 * notifier) are injected via props so this component can live in ai-ui.
 */
const AIPanelComponent = React.memo(
  ({ isOpen, clusterNotifier, hasValidConfig, children }: AIPanelComponentProps) => {
    const [width, setWidth] = React.useState('35vw');
    const [isResizing, setIsResizing] = React.useState(false);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const newWidth = window.innerWidth - e.clientX;
        const constrainedWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.8));
        setWidth(`${constrainedWidth}px`);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing]);

    if (!isOpen) {
      return null;
    }

    return (
      <Box
        flexShrink={0}
        sx={{
          height: '100%',
          width: width,
          borderLeft: '2px solid',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-8px',
            bottom: 0,
            width: '16px',
            cursor: 'ew-resize',
            zIndex: 1,
          },
        }}
      >
        {hasValidConfig && clusterNotifier}
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute',
            top: 0,
            left: '-8px',
            bottom: 0,
            width: '16px',
            cursor: 'ew-resize',
            zIndex: 10,
          }}
        />
        <PromptWidthProvider initialWidth={width}>{children}</PromptWidthProvider>
      </Box>
    );
  }
);

AIPanelComponent.displayName = 'AIPanelComponent';

export default AIPanelComponent;
