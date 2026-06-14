import { Box } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PromptWidthProvider } from '../../../contexts/PromptWidthContext/PromptWidthContext';

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_VIEWPORT_RATIO = 0.8;
const KEYBOARD_RESIZE_STEP = 20;
const SERVER_VIEWPORT_WIDTH = 1280;

/** @returns Browser viewport width, or a stable fallback during server rendering. */
function getViewportWidth(): number {
  return typeof window === 'undefined' ? SERVER_VIEWPORT_WIDTH : window.innerWidth;
}

/**
 * Constrains a requested panel width to the supported viewport range.
 *
 * @param width - Requested width in pixels.
 * @param viewportWidth - Current viewport width in pixels.
 * @returns Constrained panel width in pixels.
 */
function constrainPanelWidth(width: number, viewportWidth: number): number {
  const maximumWidth = Math.max(MIN_PANEL_WIDTH, viewportWidth * MAX_PANEL_VIEWPORT_RATIO);
  return Math.max(MIN_PANEL_WIDTH, Math.min(width, maximumWidth));
}

/**
 * Converts a supported panel CSS width to pixels.
 *
 * @param width - Panel width expressed in `px` or `vw`.
 * @param viewportWidth - Current viewport width in pixels.
 * @returns Equivalent panel width in pixels.
 */
function panelWidthInPixels(width: string, viewportWidth: number): number {
  const numericWidth = Number.parseFloat(width);
  return width.endsWith('vw') ? (numericWidth / 100) * viewportWidth : numericWidth;
}

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
  ({
    isOpen,
    clusterNotifier,
    hasValidConfig,
    children,
  }: AIPanelComponentProps): React.ReactElement | null => {
    const { t } = useTranslation();
    const [width, setWidth] = React.useState('35vw');
    const [isResizing, setIsResizing] = React.useState(false);

    /** @returns Current rendered panel width in pixels. */
    const getCurrentWidth = React.useCallback((): number => {
      return panelWidthInPixels(width, getViewportWidth());
    }, [width]);

    /** Starts pointer-based panel resizing. @param event - Handle mouse event. @returns No value. */
    const handleMouseDown = React.useCallback((event: React.MouseEvent): void => {
      event.preventDefault();
      setIsResizing(true);
    }, []);

    /**
     * Resizes the panel from its keyboard-accessible separator.
     *
     * @param event - Separator keyboard event.
     * @returns No value.
     */
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent): void => {
        const viewportWidth = getViewportWidth();
        const maximumWidth = Math.max(MIN_PANEL_WIDTH, viewportWidth * MAX_PANEL_VIEWPORT_RATIO);
        let nextWidth: number | undefined;
        if (event.key === 'ArrowLeft') {
          nextWidth = getCurrentWidth() + KEYBOARD_RESIZE_STEP;
        } else if (event.key === 'ArrowRight') {
          nextWidth = getCurrentWidth() - KEYBOARD_RESIZE_STEP;
        } else if (event.key === 'Home') {
          nextWidth = MIN_PANEL_WIDTH;
        } else if (event.key === 'End') {
          nextWidth = maximumWidth;
        }
        if (nextWidth === undefined) return;

        event.preventDefault();
        setWidth(`${constrainPanelWidth(nextWidth, viewportWidth)}px`);
      },
      [getCurrentWidth]
    );

    React.useEffect(() => {
      /** Updates panel width while dragging. @param event - Document mouse event. @returns No value. */
      const handleMouseMove = (event: MouseEvent): void => {
        if (!isResizing) return;

        const viewportWidth = getViewportWidth();
        const newWidth = viewportWidth - event.clientX;
        const constrainedWidth = constrainPanelWidth(newWidth, viewportWidth);
        setWidth(`${constrainedWidth}px`);
      };

      /** Stops pointer-based resizing. @returns No value. */
      const handleMouseUp = (): void => {
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

    React.useEffect(() => {
      /** Keeps a pixel-sized panel inside the viewport after resizing. @returns No value. */
      const handleWindowResize = (): void => {
        setWidth(currentWidth => {
          if (!currentWidth.endsWith('px')) return currentWidth;
          return `${constrainPanelWidth(Number.parseFloat(currentWidth), window.innerWidth)}px`;
        });
      };
      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }, []);

    if (!isOpen) {
      return null;
    }

    return (
      <Box
        component="aside"
        aria-label={t('AI Assistant panel')}
        flexShrink={0}
        sx={{
          height: '100%',
          width: width,
          borderLeft: '2px solid',
          position: 'relative',
        }}
      >
        {hasValidConfig && clusterNotifier}
        <Box
          role="separator"
          aria-label={t('Resize AI Assistant panel')}
          aria-orientation="vertical"
          aria-valuemin={MIN_PANEL_WIDTH}
          aria-valuemax={Math.round(
            Math.max(MIN_PANEL_WIDTH, getViewportWidth() * MAX_PANEL_VIEWPORT_RATIO)
          )}
          aria-valuenow={Math.round(getCurrentWidth())}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
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
