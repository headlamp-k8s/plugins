import { runCommand } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';

const DEBUG = false;

export interface DriverInfo {
  diskFree: string;
  dockerRunning: boolean;
  hyperVRunning: boolean;
  hyperVEnabled: boolean;
  ram: string;
  freeRam: string;
}

declare const pluginRunCommand: typeof runCommand;
declare const pluginPath: string;
const packagePath =
  pluginPath.startsWith('plugins/') || pluginPath.startsWith('plugins\\')
    ? pluginPath.substring(8)
    : pluginPath;

/**
 * @returns {diskFree: '339.65', dockerRunning: false, hyperVRunning: true, hyperVEnabled: true, ram: '24.00'}
 */
export function useInfo(): DriverInfo | null {
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
      if (DEBUG) {
        console.log('useInfo on data:', data.toString());
      }
      stdoutData += data.toString();
    });
    scriptjs.stderr.on('data', data => {
      console.error('Error from minikube info script:', data.toString());
      console.error('Error fetching minikube info:', data.toString());
    });
    scriptjs.on('exit', code => {
      if (code === 0) {
        try {
          if (DEBUG) {
            console.log('useInfo, on exit stdoutData:', stdoutData);
          }

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
