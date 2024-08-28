import { Box, Typography } from '@mui/material';
import { SettingsLink } from './SettingsLink';

export function AppCatalogTitle() {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography
        sx={{
          fontSize: '2rem',
        }}
      >
        Applications
      </Typography>
      <SettingsLink />
    </Box>
  );
}
