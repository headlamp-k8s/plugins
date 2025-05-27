import { Icon } from '@iconify/react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import React from 'react';

const driverLists = {
  macos: [
    { value: '', label: 'Autodetect' },
    { value: 'docker', label: 'Docker (VM + Container, preferred)' },
    { value: 'hyperkit', label: 'Hyperkit (VM)' },
    { value: 'virtualbox', label: 'VirtualBox (VM)' },
    { value: 'parallels', label: 'Parallels (VM)' },
    { value: 'vmwarefusion', label: 'VMware Fusion (VM)' },
    { value: 'qemu', label: 'QEMU (VM)' },
    { value: 'podman', label: 'Podman (VM + Container, experimental)' },
    { value: 'vfkit', label: 'VFkit (VM, experimental)' },
    { value: 'ssh', label: 'SSH (remote ssh)' },
  ],
  windows: [
    { value: '', label: 'Autodetect' },
    { value: 'docker', label: 'Docker (VM + Container, preferred)' },
    { value: 'virtualbox', label: 'VirtualBox (VM)' },
    { value: 'vmwarefusion', label: 'VMware Fusion (VM)' },
    { value: 'hyperv', label: 'Hyper-V (VM)' },
    { value: 'vmware', label: 'VMware (VM)' },
    { value: 'ssh', label: 'SSH (remote ssh)' },
  ],
  linux: [
    { value: '', label: 'Autodetect' },
    { value: 'docker', label: 'Docker (VM + Container, preferred)' },
    { value: 'virtualbox', label: 'VirtualBox (VM)' },
    { value: 'kvm2', label: 'KVM2 (VM)' },
    { value: 'qemu2', label: 'QEMU2 (VM)' },
    { value: 'qemu', label: 'QEMU (VM)' },
    { value: 'vmware', label: 'VMware (VM)' },
    { value: 'none', label: 'None (no VM)' },
    { value: 'podman', label: 'Podman (VM + Container, experimental)' },
    { value: 'ssh', label: 'SSH (remote ssh)' },
  ],
  unknown: [{ value: '', label: 'Autodetect' }],
};

function detectOS() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';
  return 'unknown';
}

interface DriverSelectProps {
  /**
   * Set the selected driver.
   * @param driver - The driver to set.
   */
  setDriver: (driver: string) => void;
  /** The selected driver value. */
  driver: string;
}

export default function DriverSelect({ setDriver, driver }: DriverSelectProps) {
  const drivers = driverLists[detectOS()];

  function handleChange(event: SelectChangeEvent<{ value: string }>) {
    setDriver(event.target.value as string);
  }

  return (
    <>
      <Box sx={{ mt: 2 }} display="flex" alignItems="center">
        <InputLabel id="driver-select-label">Driver</InputLabel>
      </Box>
      <Box display="flex" alignItems="center">
        <FormControl>
          <Select
            labelId="driver-select-label"
            id="driver-select"
            value={{ value: driver }}
            label="Driver"
            displayEmpty
            onChange={handleChange}
            aria-labelledby="driver-select-label"
          >
            {drivers.map(dr => (
              <MenuItem key={dr.value} value={dr.value}>
                {dr.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip
          title={
            <Box>
              See{' '}
              <Link
                href="https://minikube.sigs.k8s.io/docs/drivers/"
                target="_blank"
                rel="noopener noreferrer"
              >
                information about specific drivers
              </Link>
              . If minikube fails to start, see the drivers page for help setting up a compatible
              container or virtual-machine manager.
            </Box>
          }
        >
          <IconButton>
            <Icon icon="mdi:information-outline" />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}
