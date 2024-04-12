import { Icon } from '@iconify/react';
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
  let button = (
    <Button
      variant="contained"
      disabled
      sx={{
        backgroundColor: '#000',
        color: 'white',
        textTransform: 'none',
      }}
    >
      <CircularProgress color="secondary" value={props.progress} size={20} />
    </Button>
  );
  if (props.progress > 0 && props.progress < 100) {
    button = (
      <Button
        variant="contained"
        onClick={() => props.onCancel()}
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
