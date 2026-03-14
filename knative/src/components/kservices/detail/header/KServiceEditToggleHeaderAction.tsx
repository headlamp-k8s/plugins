import { FormControlLabel, Switch } from '@mui/material';
import { useKServiceEditMode } from '../hooks/useKServiceEditMode';
import { useKServicePermissions } from '../permissions/KServicePermissionsProvider';

export function KServiceEditToggleHeaderAction() {
  const { isEditMode, setIsEditMode } = useKServiceEditMode();
  const { canPatchKService } = useKServicePermissions();

  console.log('KServiceEditToggleHeaderAction rendered', { isEditMode, canPatchKService });

  console.log('KServiceEditToggleHeaderAction returning Switch control');
  return (
    <FormControlLabel
      control={
        <Switch
          checked={isEditMode}
          onChange={e => {
            console.log('Edit Toggle clicked, new value:', e.target.checked);
            setIsEditMode(e.target.checked);
          }}
          color="primary"
        />
      }
      label="Edit Mode"
      sx={{ ml: 2 }}
    />
  );
}
