import { useSnackbar } from 'notistack';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Link } from '@mui/material';
import { useBetween } from 'use-between';
import React from 'react';

const useDialogController = () => {
  const [open, setOpen] = React.useState(false);
  return {
    open,
    setOpen,
  };
};

const useConplianceSettings = () => {
  const [hasConsent, setHasConsent] = React.useState<null | boolean>(null);
  return {
    hasConsent,
    setHasConsent,
  };
};

export function useCompliance() {
  return useBetween(useConplianceSettings);
}

export function useConsentDialog() {
  return useBetween(useDialogController);
}

export function UserConsentDialog() {
  const { open, setOpen } = useConsentDialog();
  const { setHasConsent } = useCompliance();

  return (
    <Dialog open={open}>
      <DialogTitle>Help us improve Headlamp</DialogTitle>
      <DialogContent>
        <Typography>
          Help us make Headlamp better by collecting anonymous data.
        </Typography>
        <Typography variant="body1">
          Some more text here...
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          size="small"
          onClick={() => {
            setOpen(false);
            setHasConsent(false);
          }}
        >
          Reject anyway
        </Button>
        <Button
          size="small"
          onClick={() => {
            setOpen(false)
            setHasConsent(false);
          }}
        >
          I accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function useConsentSnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { setOpen } = useConsentDialog();
  const { setHasConsent } = useCompliance();
  const key = 'consent-snackbar';

  function SnackbarMessage() {
    return (
      <Typography>
        Help improve Headlamp by allowing anonymous data collection.
        <Link
          onClick={() => {
            setOpen(true);
            closeSnackbar(key);
          }}
          sx={{
            color: 'white',
            textDecoration: 'underline',
            cursor: 'pointer',
            ml: 1,
          }}
        >
          More Options
        </Link>
      </Typography>
    );
  }

  return () => {
    enqueueSnackbar(<SnackbarMessage />, {
      key,
      variant: 'info',
      persist: true,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
      action: () => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setHasConsent(true)
            closeSnackbar(key);
          }}
          sx={{
            ml: 2,
            color: 'black',
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            },
          }}
        >
          Accept
        </Button>
      ),
    });
  };
}
