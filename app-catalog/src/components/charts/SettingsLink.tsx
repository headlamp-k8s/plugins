import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link as RouterLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography, useTheme } from '@mui/material';

export function SettingsLink() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <RouterLink routeName="pluginDetails" params={{ name: '@headlamp-k8s/app-catalog' }} tooltip={t('App-Catalog Settings')}>
      <Typography
        sx={{
          size: '1rem',
          marginLeft: '3rem',
          color: theme.palette.text.primary,
        }}
      >
        {t('Settings')}
      </Typography>
    </RouterLink>
  );
}
