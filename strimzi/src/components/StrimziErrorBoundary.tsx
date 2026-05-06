import React from 'react';
import { Box, Typography } from '@mui/material';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';

interface State {
  hasError: boolean;
  message: string;
}

/**
 * React Error Boundary for the Strimzi plugin.
 *
 * Wrapping every plugin route in this boundary ensures that uncaught
 * render errors inside any Strimzi component are contained here and
 * never propagate up to Headlamp's root. Without this, a render crash
 * inside the plugin can blank the entire Headlamp UI.
 */
export class StrimziErrorBoundary extends React.Component<
  React.PropsWithChildren<unknown>,
  State
> {
  constructor(props: React.PropsWithChildren<unknown>) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[Strimzi plugin] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SectionBox title="Strimzi plugin error">
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" gutterBottom>
              Something went wrong while rendering this view.
            </Typography>
            <Typography variant="body2" color="text.secondary" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {this.state.message}
            </Typography>
          </Box>
        </SectionBox>
      );
    }
    return this.props.children;
  }
}
