/**
 * This is for helping users to do some tasks with minikube.
 *
 * This script only uses node stdlib modules.
 *
 * manage-minikube.js ask-restart-windows
 * manage-minikube.js setup-hyperV-windows-networking
 * manage-minikube.js ask-restart-libvirt-ubuntu24
 */
const { exec, execSync, spawn } = require('child_process');
const { unlinkSync } = require('fs');
const { createServer } = require('net');
const { platform } = process;

// @ts-check

// enable typescript checking of a js file

const DEBUG = false;

/**
 * Requests a system restart on Windows with elevated privileges.
 */
function askRestartWindows() {
  exec(
    'powershell -Command "Start-Process shutdown -ArgumentList \'/r /t 0\' -Verb RunAs"',
    error => {
      if (error) {
        console.error('Failed to request restart:', error.message);
      } else {
        console.log('Restart requested with elevation.');
      }
    }
  );
}

// Start minikube with elevated privs.
// Opens a new window.
// powershell -Command "Start-Process 'minikube' -ArgumentList 'start --driver=hyperv' -Verb RunAs"
// Start-Process "cmd.exe" -ArgumentList "/c minikube start --driver=hyperv > C:\temp\log.txt 2>&1" -Verb RunAs -WindowStyle Hidden
// powershell -Command "Start-Process 'cmd.exe' -ArgumentList '/c minikube start --driver=hyperv > C:\temp\log.txt 2>&1' -Verb RunAs -WindowStyle Hidden"

/**
 * For Hyper-V Windows networking setup.
 */
function setupHyperVWindowsNetworking() {
  //@todo: when we know what is needed,,
  console.log('tbd');
}

/**
 * Prompts the user to restart libvirt service on Ubuntu 24 systems.
 *
 * This function verifies the current platform is Linux and specifically Ubuntu 24
 * before prompting the user to restart the libvirt service. This is typically
 * needed after making configuration changes to libvirt.
 *
 * @returns {void}
 * @throws {Error} If there's an issue checking the OS information
 */
function askRestartLibvirtUbuntu24() {
  if (platform !== 'linux') {
    console.error('This command is only available on Linux.');
    return;
  }

  try {
    const osRelease = execSync('cat /etc/os-release').toString();
    if (!osRelease.includes('Ubuntu') || !osRelease.includes('24.')) {
      console.error('This command is specific to Ubuntu 24.');
      return;
    }

    // User input handling would go here
  } catch (error) {
    console.error('Failed to check OS or restart libvirt:', error.message);
  }
}

/**
 * This is designed to run a command (specifically `minikube start`)
 * in an **elevated** (administrator) context
 * while keeping the command window **hidden** in the background.
 *
 * This is necessary because:
 *
 * - `minikube` with the Hyper-V driver often requires administrative privileges.
 * - Running `cmd.exe` with `Start-Process -Verb RunAs` elevates the process,
 *   but detaches it from the parent process.
 * - To capture the output (stdout, stderr) and exit code from the elevated process,
 *   we use **named pipes**.
 *
 * - Creates three named pipes for stdout, stderr, and exit code.
 * - Launches an elevated `cmd.exe` process via PowerShell using `Start-Process`.
 * - Redirects output and error streams to the named pipes using standard CMD redirection (`>`, `2>`, `&`).
 * - Writes stdout and stderr to the Node.js process's own output streams.
 * - Exits the Node.js process with the same exit code as the `minikube` command.
 *
 * This approach allows for elevated execution with full output capture,
 * without showing a visible command window.
 *
 * Additionally the UAC screen shows cmd by Microsoft, and the user can
 * see the command being run with privileges.
 *
 * For example it shows the user on the UAC screen:
 * `cmd.exe /c minikube start --driver=hyperv > \\.\pipe\minikube-123456-stdout 2> \\.\pipe\minikube-123456-stderr & echo %ERRORLEVEL% > \\.\pipe\minikube-123456-exit`
 * Not:
 * `Electron somescript.js`
 */
function runPrivilegedCommand(mainCommand) {
  const pipeBase = `\\\\.\\pipe\\minikube-${Math.floor(Math.random() * 1000000)}`;
  const pipes = {
    stdout: `${pipeBase}-stdout`,
    stderr: `${pipeBase}-stderr`,
    exit: `${pipeBase}-exit`,
  };

  let exitCode = null;

  // Create named pipe servers
  const createPipeServer = (name, outputStream, onClose) => {
    const server = createServer(stream => {
      stream.on('data', data => {
        outputStream.write(data.toString());
      });
      stream.on('end', () => {
        if (onClose) onClose();
      });
    });

    server.listen(name, () => {
      if (DEBUG) {
        console.log(`Listening on ${name}`);
      }
    });

    return server;
  };

  // Track when all pipes are done
  let pipesClosed = 0;
  const onPipeClosed = () => {
    pipesClosed++;
    if (pipesClosed === 3) {
      process.exit(exitCode ?? 1); // Default to 1 if exit code wasn't received
    }
  };

  // Start pipe servers
  createPipeServer(pipes.stdout, process.stdout, onPipeClosed);
  createPipeServer(pipes.stderr, process.stderr, onPipeClosed);
  createPipeServer(
    pipes.exit,
    {
      write: data => {
        const code = parseInt(data.toString().trim(), 10);
        if (!isNaN(code)) {
          exitCode = code;
        }
      },
    },
    onPipeClosed
  );

  // PowerShell command to run cmd.exe with redirection to named pipes
  const psCommand = `
  Start-Process 'cmd.exe' -ArgumentList '/c ${mainCommand} > ${pipes.stdout} 2> ${pipes.stderr} & echo %ERRORLEVEL% > ${pipes.exit}' -Verb RunAs -WindowStyle Hidden
  `;

  // Launch PowerShell to run the command
  spawn('powershell.exe', ['-Command', psCommand], {
    stdio: 'ignore',
    windowsHide: true,
  });
}

/**
 *
 * @param {string[]} args extra arguments to pass to minikube start
 */
function startMinikubeHyperV(args) {
  const mainCommand =
    'minikube start --driver=hyperv' + (args.length > 0 ? ' ' + args.join(' ') : '');
  runPrivilegedCommand(mainCommand);
}

function info() {
  /**
   * Checks to see if services like Hyper-V are running, and other system info.
   * On mac/win/linux.
   *
   * {"diskFree":"720.47","dockerRunning":true,"hyperVRunning":true,"ram":"15.42"}
   */
  function detectIfHyperVRunning() {
    try {
      const output = execSync('sc query vmms').toString();
      if (output.includes('RUNNING')) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  function detectIfDockerRunning() {
    try {
      const output = execSync('docker info', { stdio: ['ignore', 'pipe', 'pipe'] });
      const stdout = output.toString();
      return stdout.includes('Server Version');
    } catch (error) {
      return false;
    }
  }

  function getRamWindows() {
    try {
      const output = execSync('wmic computersystem get TotalPhysicalMemory').toString();
      const ramInBytes = parseInt(output.split('\n')[1].trim(), 10);
      // Convert to GB, 2 decimals
      return (ramInBytes / (1024 * 1024 * 1024)).toFixed(2);
    } catch (error) {
      console.error('Failed to get RAM:', error.message);
      return null;
    }
  }

  function getRamMac() {
    try {
      const output = execSync('sysctl -n hw.memsize').toString();
      const ramInBytes = parseInt(output.trim(), 10);
      // Convert to GB, 2 decimals
      return (ramInBytes / (1024 * 1024 * 1024)).toFixed(2);
    } catch (error) {
      console.error('Failed to get RAM:', error.message);
      return null;
    }
  }

  function getRamLinux() {
    try {
      const output = execSync("free -m | awk 'NR==2{print $2}'").toString();
      const ramMb = parseInt(output.trim(), 10);
      if (isNaN(ramMb)) return null;
      // Convert MB to GB, 2 decimals
      return (ramMb / 1024).toFixed(2);
    } catch (error) {
      console.error('Failed to get RAM:', error.message);
      return null;
    }
  }

  function getDiskFreeLinux() {
    try {
      const output = execSync("df -k / | tail -n 1 | awk '{print $4}'").toString();
      const freeKb = parseInt(output.trim(), 10);
      if (isNaN(freeKb)) return null;
      // Convert KB to GB, 2 decimals
      return (freeKb / (1024 * 1024)).toFixed(2);
    } catch (error) {
      console.error('Failed to get disk space:', error.message);
      return null;
    }
  }

  /**
   * @returns gigabytes of free disk space on macOS as a number
   */
  function getDiskFreeMac() {
    try {
      const output = execSync("df -k / | tail -n 1 | awk '{print $4}'").toString();
      const freeKb = parseInt(output.trim(), 10);
      if (isNaN(freeKb)) return null;
      // Convert KB to GB, 2 decimals
      return (freeKb / (1024 * 1024)).toFixed(2);
    } catch (error) {
      console.error('Failed to get disk space:', error.message);
      return null;
    }
  }

  function getDiskFreeWindows() {
    try {
      const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
      const lines = output.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) return null;
      const diskInfo = lines[1].split(/\s+/);
      const freeSpace = parseInt(diskInfo[1], 10);
      if (isNaN(freeSpace)) return null;
      // Return GB as number, 2 decimals
      return (freeSpace / (1024 * 1024 * 1024)).toFixed(2);
    } catch (error) {
      console.error('Failed to get disk space:', error.message);
      return null;
    }
  }

  const info = {};

  if (platform === 'win32') {
    info.diskFree = getDiskFreeWindows();
    info.dockerRunning = detectIfDockerRunning();
    info.hyperVRunning = detectIfHyperVRunning();
    info.ram = getRamWindows();
  }

  if (platform === 'darwin') {
    info.diskFree = getDiskFreeMac();
    info.dockerRunning = detectIfDockerRunning();
    info.ram = getRamMac();
  }

  if (platform === 'linux') {
    info.diskFree = getDiskFreeLinux();
    info.dockerRunning = detectIfDockerRunning();
    info.ram = getRamLinux();
  }

  console.log(JSON.stringify(info));
  process.exit(0);
}

const commands = {
  // 'ask-restart-windows': askRestartWindows,
  // 'setup-hyperV-windows-networking': setupHyperVWindowsNetworking,
  // 'ask-restart-libvirt-ubuntu24': askRestartLibvirtUbuntu24,
  'start-minikube-hyperv': startMinikubeHyperV,
  info: info,
};

/**
 * @returns the command and the rest of the args.
 *
 * We do basic command line parsing without any libraries.
 * Because this script can't use third party libraries without bundling them.
 */
function parseCommandLineArgs() {
  return [process.argv[2], process.argv.slice(3)];
}

function main() {
  const [command, args] = parseCommandLineArgs();

  if (!command || !commands[command]) {
    console.error(command ? `Unknown command: ${command}` : 'No command provided');
    console.log('Available commands:');
    Object.keys(commands).forEach(cmd => console.log(`- ${cmd}`));
    return;
  }

  commands[command](args);
}

main();
