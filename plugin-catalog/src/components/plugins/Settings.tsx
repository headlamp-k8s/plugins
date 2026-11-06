import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { configStore, usePluginCatalogConfig } from '../../config';

export function Settings() {
  const data = usePluginCatalogConfig();
  const { t } = useTranslation();
  const id = useId();

  const settingsRows = [
    {
      key: 'displayOnlyOfficialPlugins',
      name: t('Display only official plugins'),
      description: t('Show only official packages from Artifact Hub.'),
    },
    {
      key: 'displayOnlyVerifiedPlugins',
      name: t('Display only verified plugins'),
      description: t('Show only packages from verified publishers on Artifact Hub.'),
    },
  ] as const;

  return (
    <Paper variant="outlined" sx={{ mt: 2, px: 2 }}>
      {settingsRows.map(row => (
        <Box
          component="label"
          htmlFor={`${id}-${row.key}`}
          key={row.key}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            cursor: 'pointer',
            '&:not(:last-child)': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Box component="span">
            <Typography component="span" id={`${id}-${row.key}-label`} sx={{ display: 'block' }}>
              {row.name}
            </Typography>
            <Typography
              component="span"
              id={`${id}-${row.key}-description`}
              variant="body2"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              {row.description}
            </Typography>
          </Box>
          <Switch
            checked={data?.[row.key] ?? true}
            inputProps={{
              id: `${id}-${row.key}`,
              'aria-labelledby': `${id}-${row.key}-label`,
              'aria-describedby': `${id}-${row.key}-description`,
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              configStore.update({ [row.key]: event.target.checked })
            }
          />
        </Box>
      ))}
    </Paper>
  );
}
