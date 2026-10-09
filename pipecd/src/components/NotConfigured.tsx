import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import React from 'react';

export function NotConfigured(): JSX.Element {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="50vh">
      <Paper elevation={2} sx={{ p: 5, maxWidth: 480, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          PipeCD Not Configured
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter your PipeCD server URL and API key in the plugin settings to start viewing your
          deployments.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" href="#/pipecd/settings">
            Configure PipeCD
          </Button>
          <Button
            variant="outlined"
            href="https://pipecd.dev/docs/user-guide/managing-apikey/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API Key
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" mt={3} display="block">
          The API key requires at minimum the <strong>READ_ONLY</strong> role.
        </Typography>
      </Paper>
    </Box>
  );
}
