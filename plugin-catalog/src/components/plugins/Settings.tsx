import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';

export function Settings(props) {
  const { data, onDataChange } = props;
  const { t } = useTranslation();

  const settingsRows = [
    {
      name: t('Display only Official Plugins'),
      value: (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Switch
            checked={data?.displayOnlyOfficialPlugins ?? true}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onDataChange({ ...data, displayOnlyOfficialPlugins: event.target.checked })
            }
          />
        </Box>
      ),
    },
    {
      name: t('Display only Verified Plugins'),
      value: (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Switch
            checked={data?.displayOnlyVerifiedPlugins ?? true}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onDataChange({ ...data, displayOnlyVerifiedPlugins: event.target.checked })
            }
          />
        </Box>
      ),
    },
  ];

  return (
    <Box width={'100%'}>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}
