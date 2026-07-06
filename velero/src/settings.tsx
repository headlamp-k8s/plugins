import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { DEFAULT_VELERO_NAMESPACE } from './config';

export function Settings(props: {
  data?: { veleroNamespace?: string };
  onDataChange: (data: { veleroNamespace?: string }) => void;
}) {
  const { data, onDataChange } = props;

  return (
    <Box width="80%">
      <NameValueTable
        rows={[
          {
            name: 'Velero namespace',
            value: (
              <TextField
                fullWidth
                helperText="Namespace where Velero Schedule and Backup CRs are stored"
                defaultValue={data?.veleroNamespace ?? DEFAULT_VELERO_NAMESPACE}
                onChange={event => onDataChange({ ...data, veleroNamespace: event.target.value })}
                variant="standard"
              />
            ),
          },
        ]}
      />
    </Box>
  );
}
