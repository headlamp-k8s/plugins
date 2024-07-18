import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

export function Settings(props) {
  const { data, onDataChange } = props;

  const settingsRows = [
    {
      name: 'Enable in list view',
      value: (
        <Switch
          checked={data?.isEnabledInListView ?? true}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onDataChange({ ...data, isEnabledInListView: event.target.checked })
          }
        />
      ),
    },
    {
      name: 'Namespace',
      value: (
        <TextField
          helperText="Please enter the namespace where Opencost is Installed"
          defaultValue={data?.namespace ? data.namespace : ''}
          onChange={e => onDataChange({ ...data, namespace: e.target.value })}
          variant="standard"
        />
      ),
    },
    {
      name: 'Service URL',
      value: (
        <TextField
          fullWidth
          helperText="Please enter the service URL of Opencost web UI service"
          defaultValue={data?.serviceURL ? data.serviceURL : ''}
          onChange={e => onDataChange({ ...data, serviceURL: e.target.value })}
          variant="standard"
        />
      ),
    },
    {
      name: 'Default timespan',
      value: (
        <>
          <Select
            value={data?.defaultTimespan ?? '14d'}
            onChange={e => onDataChange({ ...data, defaultTimespan: e.target.value })}
          >
            <MenuItem value={'today'}>Today</MenuItem>
            <MenuItem value={'yesterday'}>Yesterday</MenuItem>
            <MenuItem value={'24h'}>24 hours</MenuItem>
            <MenuItem value={'48h'}>48 hours</MenuItem>
            <MenuItem value={'week'}>Week</MenuItem>
            <MenuItem value={'lastweek'}>Last week</MenuItem>
            <MenuItem value={'7d'}>7 days</MenuItem>
            <MenuItem value={'14d'}>14 days</MenuItem>
          </Select>
        </>
      ),
    },
    {
      name: 'Display currency',
      value: (
        <TextField
          helperText="Enter the currency symbol to display"
          defaultValue={data?.displayCurrency ? data.displayCurrency : '$'}
          onChange={e => onDataChange({ ...data, displayCurrency: e.target.value })}
          variant="standard"
        />
      ),
    },
  ];
  return (
    <Box width={'80%'}>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}
