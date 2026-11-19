import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React from 'react';

/**
 * Props for the LoadingIndicator component.
 */
interface LoadingIndicatorProps {
  loading: boolean;
  error: string | null;
}

/**
 * A component to display loading state and error messages.
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loading, error }) => {
  return (
    <>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}
    </>
  );
};

export default LoadingIndicator;
