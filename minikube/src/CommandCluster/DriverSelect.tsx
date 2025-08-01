import { Icon } from '@iconify/react';
import { runCommand } from '@kinvolk/headlamp-plugin/lib';
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

declare const pluginRunCommand: typeof runCommand;
declare const pluginPath: string;
const packagePath =
  pluginPath.startsWith('plugins/') || pluginPath.startsWith('plugins\\')
    ? pluginPath.substring(8)
    : pluginPath;

interface DriverInfo {
  diskFree: string;
  dockerRunning: boolean;
  hyperVRunning: boolean;
  ram: string;
}

/**
 *
 * @returns {diskFree: '339.65', dockerRunning: false, hyperVRunning: true, ram: '24.00'}
 */
function useInfo(): DriverInfo | null {
  const [info, setInfo] = React.useState<DriverInfo | null>(null);

  React.useEffect(() => {
    let stdoutData = '';
    const scriptjs = pluginRunCommand(
      //@ts-ignore
      'scriptjs',
      [`${packagePath}/manage-minikube.js`, '-headless', 'info'],
      {}
    );
    scriptjs.stdout.on('data', data => {
      console.log('Data from minikube info script:', data.toString());
      stdoutData += data.toString();
    });
    scriptjs.stderr.on('data', data => {
      console.error('Error from minikube info script:', data.toString());
      console.error('Error fetching minikube info:', data.toString());
    });
    scriptjs.on('exit', code => {
      if (code === 0) {
        try {
          console.log('Minikube info:', stdoutData);
          // Has these two lines we need to strip out from the beginning if they exist:
          // "App starting..."
          // "Check for updates:  true"
          // Remove both lines if present, regardless of line ending (\n or \r\n)
          stdoutData = stdoutData.replace(/^\s*App starting\.\.\.\s*[\r\n]+/m, '');
          stdoutData = stdoutData.replace(/^\s*Check for updates:\s+true\s*[\r\n]+/m, '');

          // find first "{"
          const firstCurly = stdoutData.indexOf('{');
          if (firstCurly !== -1) {
            stdoutData = stdoutData.substring(firstCurly);
          }
          console.log('Parsed minikube info:', stdoutData);
          setInfo(JSON.parse(stdoutData));
        } catch (e) {
          console.error('Failed to parse minikube info JSON:', e, stdoutData);
          setInfo(null);
        }
      } else {
        console.error('Failed to fetch minikube info, exit code:', code, stdoutData);
        setInfo(null);
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return info;
}

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
    { value: 'vfkit', label: 'VFkit' },
    { value: 'ssh', label: 'SSH (remote ssh)' },
  ],
  windows: [
    { value: '', label: 'Autodetect' },
    { value: 'hyperv', label: 'Hyper-V (VM)' },
    { value: 'docker', label: 'Docker (VM + Container)' },
    { value: 'virtualbox', label: 'VirtualBox (VM)' },
    { value: 'vmwarefusion', label: 'VMware Fusion (VM)' },
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

/**
 * @returns the MacOS version as a string, e.g., "13.4"
 */
function getMacOSVersion() {
  const userAgent = navigator.userAgent;
  // Handle both "Mac OS X" (traditional) and "macOS" (modern) in user agent
  const match = userAgent.match(/Mac(?:intosh|) (?:OS X|OS) (\d+)[._](\d+)/i);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return `${major}.${minor}`;
  }
  return null;
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

/**
 * A hook that returns the available drivers for the current OS.
 *
 * With some logic to detect things and move drivers to top of list.
 */
function useDrivers(): { value: string; label: string }[] | null {
  const info = useInfo();
  const os = detectOS();
  const drivers = driverLists[os];
  const isInfoAvailable = info !== null;
  console.log('info, isInfoAvailable:', info, isInfoAvailable);

  if (!isInfoAvailable) {
    return null;
  }

  if (os === 'macos') {
    const macOSVersion = getMacOSVersion();
    if (macOSVersion && parseFloat(macOSVersion) >= 10.13) {
      // remove vfkit if it exists
      const vfkitIndex = drivers.findIndex(driver => driver.value === 'vfkit');
      if (vfkitIndex !== -1) {
        drivers.splice(vfkitIndex, 1);
      }
      // add vfkit to the top
      drivers.unshift({ value: 'vfkit', label: 'VFkit' });
    } else if (info && info.dockerRunning) {
      // If docker is running, make docker the first option
      const dockerIndex = drivers.findIndex(driver => driver.value === 'docker');
      if (dockerIndex !== -1) {
        const dockerDriver = drivers.splice(dockerIndex, 1)[0];
        drivers.unshift(dockerDriver);
      }
    }
    // Otherwise autodetect is the first option
  } else if (os === 'windows') {
    // If windows, and docker is running, make docker the first option

    if (info && info.dockerRunning) {
      const dockerIndex = drivers.findIndex(driver => driver.value === 'docker');
      if (dockerIndex !== -1) {
        const dockerDriver = drivers.splice(dockerIndex, 1)[0];
        drivers.unshift(dockerDriver);
      }
    } else if (info && info.hyperVRunning) {
      // If hyperv is running, make hyperv the first option
      const hypervIndex = drivers.findIndex(driver => driver.value === 'hyperv');
      if (hypervIndex !== -1) {
        const hypervDriver = drivers.splice(hypervIndex, 1)[0];
        drivers.unshift(hypervDriver);
      }
    }
    // Otherwise autodetect is the first option
  }
  return drivers;
}

export default function DriverSelect({ setDriver, driver }: DriverSelectProps) {
  const drivers = useDrivers();
  console.log('Drivers:', drivers);

  // Only set to the first driver if driver is '' and it's the initial mount.
  const initialMount = React.useRef(true);
  React.useEffect(() => {
    // Also wait for driver to be available (not null)
    if (initialMount.current && driver === '' && drivers && drivers.length > 0) {
      setDriver(drivers[0].value);
      initialMount.current = false;
    }
  }, [driver, drivers, setDriver]);

  function handleChange(event: SelectChangeEvent<string>) {
    setDriver(event.target.value as string);
  }

  if (!drivers) {
    return (
      <Box sx={{ mt: 2 }} display="flex" alignItems="center">
        <InputLabel id="driver-select-label">Driver</InputLabel>
        <Box ml={2}>Detecting drivers...</Box>
      </Box>
    );
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
            value={driver}
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
