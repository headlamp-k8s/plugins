import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * LoadingButtonProps interface represents the properties for the LoadingButton component.
 *
 * @property {number} progress - The progress of the loading operation, represented as a number between 0 and 100.
 * @property {() => void} onCancel - A function that is called when the loading operation is cancelled.
 */
export interface LoadingButtonProps {
  progress: number; // 0-100
  onCancel: () => void;
}

const LoadingButton = (props: LoadingButtonProps) => {
  const { t } = useTranslation();
  let button = (
    <Button
      variant="contained"
      disabled
      aria-label={t('Loading')}
      sx={{
        backgroundColor: '#000',
        color: 'white',
        textTransform: 'none',
      }}
    >
      <CircularProgress
        color="primary"
        value={props.progress}
        size={20}
        aria-label={t('Loading')}
      />
    </Button>
  );
  if (props.progress > 0 && props.progress < 100) {
    button = (
      <Button
        variant="contained"
        onClick={() => props.onCancel()}
        aria-label={t('Cancel')}
        sx={{
          backgroundColor: '#000',
          color: 'white',
          textTransform: 'none',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
          }}
        >
          <CircularProgress
            color="inherit"
            variant="determinate"
            value={props.progress}
            size={20}
            aria-label={t('Installation progress')}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:stop" />
          </Box>
        </Box>
      </Button>
    );
  }

  return <>{button}</>;
};

export default LoadingButton;
