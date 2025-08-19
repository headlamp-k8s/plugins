import { clusterAction, runCommand } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { Prompt } from 'react-router-dom';
import CommandDialog from './CommandDialog';
import { useInfo } from './useInfo';

const DEBUG = false;

declare const pluginRunCommand: typeof runCommand;
declare const pluginPath: string;
const packagePath =
  pluginPath.startsWith('plugins/') || pluginPath.startsWith('plugins\\')
    ? pluginPath.substring(8)
    : pluginPath;

interface CommandClusterProps {
  /**
   * Function to call when the command is about to be started (but not quite started yet)
   * The user can cancel the command still.
   */
  onCommandStarted?: () => void;
  /** should it use a dialog or use a grid? */
  useGrid?: boolean;
  /** Is the dialog open? */
  open?: boolean;
  /** The name of the cluster to act on */
  initialClusterName?: string;
  /** The function to call when the dialog is closed */
  handleClose: () => void;
  /** The function to call when the user confirms the action */
  onConfirm: () => void;
  /** Command to run (stop, start, delete, etc) */
  command: string;
  /** Ask for the cluster name. Otherwise the initialClusterName is used. */
  askClusterName?: boolean;
}

// const runningCommand = {
//   clusterName : null,
//   driver: null,
//   command: null,
//   exitCode: null,
//   stdoutData: [],
//   errorData: [],
//   allData: [],
//   props: effectiveProps,
// };

type RunningCommandType = {
  clusterName: string | null;
  command: string;
  driver: string | null;
  runCommand: {
    stdout: {
      on: (event: string, listener: (chunk: any) => void) => void;
    };
    stderr: {
      on: (event: string, listener: (chunk: any) => void) => void;
    };
    on: (event: string, listener: (code: number | null) => void) => void;
  } | null;
  exitCode: number | null;
  stdoutData: string[];
  errorData: string[];
  allData: string[];
  props: CommandClusterProps;
};

const commandsRunning = [];

/**
 * Runs a command on a cluster, and shows the output in a dialog.
 */
export default function CommandCluster(props: CommandClusterProps) {
  const {
    onCommandStarted,
    open: startOpen,
    initialClusterName,
    handleClose,
    onConfirm,
    command,
  } = props;
  const [openDialog, setOpenDialog] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [runningLines, setRunningLines] = React.useState<string[]>([]);
  const [commandDone, setCommandDone] = React.useState(false);
  const [theCluster, setTheCluster] = React.useState<string | null>(null);
  const runningCommandsRef = React.useRef<RunningCommandType[]>(commandsRunning);
  const [runningCommand, setRunningCommand] = React.useState<RunningCommandType | null>(null);
  const info = useInfo();
  const minikubeProfiles = info ? info.minikubeProfiles : null;

  if (DEBUG) {
    console.log('CommandCluster 1', {
      props,
      'runningCommandsRef.current': runningCommandsRef.current,
      runningCommand,
      minikubeProfiles,
    });
  }

  // on initial mount, we want to see if there is a command running already
  // If there is a command running in runningCommandsRef.current with exit code not null,
  // then we remove it from runningCommandsRef.current
  React.useEffect(() => {
    const runningCommand = runningCommandsRef.current.find(cmd => cmd.exitCode !== null);
    if (DEBUG) {
      console.log('CommandCluster 1.2, runningCommand:', runningCommand);
    }
    if (runningCommand) {
      runningCommandsRef.current = runningCommandsRef.current.filter(cmd => cmd !== runningCommand);
    }
    if (DEBUG) {
      console.log('CommandCluster 1.3, runningCommandsRef.current:', runningCommandsRef.current);
    }
  }, []);

  React.useEffect(function updateRunningLines() {
    // Make sure react gets notified of the changes to the array
    const intervalId = setInterval(() => {
      if (!runningCommandsRef) {
        // if (DEBUG) {
        //   console.log('CommandCluster updateRunningLines 2 returning');
        // }
        return;
      }
      // last one on the list
      const runningCommand = runningCommandsRef.current[runningCommandsRef.current.length - 1];
      const lines = [...(runningCommand?.allData || [])];
      // if (DEBUG) {
      //   console.log('CommandCluster updateRunningLines 3, runningCommand:', runningCommand, lines);
      // }
      setRunningLines(lines);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  // If runningCommandsRef is not [] empty then we set the runningCommand to the last one
  React.useEffect(() => {
    if (runningCommandsRef.current.length > 0) {
      if (DEBUG) {
        console.log(
          'CommandCluster runningCommandsRef useEffect 4, setting running command',
          runningCommandsRef.current
        );
      }

      // Set the runningCommand to the last one in the list that has the same command.
      const runningCommand = runningCommandsRef.current.find(cmd => cmd.props.command === command);
      if (DEBUG) {
        console.log(
          'CommandCluster runningCommandsRef useEffect 4.1, runningCommand',
          runningCommand
        );
      }

      if (runningCommand) {
        setRunningCommand(runningCommand);
        if (runningCommand.exitCode === null) {
          // The command is still running, so we set the state to show the dialog
          setOpenDialog(true);
          setActing(true);
          setRunning(true);
          setCommandDone(false);
          setTheCluster(runningCommand.clusterName);
          if (DEBUG) {
            console.log(
              'CommandCluster runningCommandsRef useEffect 4.2, runningCommand',
              runningCommand
            );
          }
        } else {
          // The command has finished, but we should still show the dialog
          // so the user can see the output, and let them press the close button.
          setOpenDialog(true);
          setActing(false);
          setRunning(false);
          setCommandDone(true);
          setTheCluster(runningCommand.clusterName);
          const lines = [...(runningCommand?.allData || [])];
          setRunningLines(lines);

          if (DEBUG) {
            console.log(
              'CommandCluster runningCommandsRef useEffect 4.3, runningCommand',
              runningCommand
            );
          }
        }
      }
    }
  }, [runningCommandsRef.current]);

  React.useEffect(() => {
    if (startOpen) {
      setOpenDialog(true);
    }
  }, [startOpen]);

  React.useEffect(() => {
    if (runningCommand && runningCommand.exitCode !== null) {
      if (DEBUG) {
        console.log('CommandCluster runningCommand?.exitCode 6, setting command done');
      }
      setCommandDone(true);
    }
  }, [runningCommand?.exitCode]);

  function handleRunCommand({ clusterName, driver }: { clusterName: string; driver: string }) {
    if (DEBUG) {
      console.log('runFunc 10 handleSave', clusterName);
    }
    setTheCluster(clusterName);
    setActing(true);
    onCommandStarted && onCommandStarted();

    function runFunc(clusterName: string) {
      if (DEBUG) {
        console.log('runFunc 11', clusterName);
      }
      const args = [command];
      if (command === 'stop') {
        // minikube removes the context from kubectl config when stopping by default
        // so we ask it to not remove it
        // "keep the kube-context active after cluster is stopped. Defaults to false."
        args.push('--keep-context-active', 'true');
      }

      if (command !== 'start') {
        // remove "--driver=xxx" if it exists. eg --driver=docker or "--driver=hyperv"
        const driverIndex = args.findIndex(arg => arg.startsWith('--driver='));
        if (driverIndex !== -1) {
          args.splice(driverIndex, 1);
        }
      }

      args.push('-p', clusterName);
      let minikube = null;

      const existingProfile = minikubeProfiles?.valid?.find(profile => profile.Name === clusterName);
      const isHyperV = driver === 'hyperv' || existingProfile?.Config?.Driver === 'hyperv';
      const isVfkit = driver === 'vfkit' || existingProfile?.Config?.Driver === 'vfkit';
      if (DEBUG) {
        console.log({ minikubeProfiles, isHyperV, isVfkit, driver, existingProfile });
      }

      if (isHyperV) {
        // If hyperv, we use the scriptjs to run the command because it needs to run with admin rights
        const commandHyperV = `${command}-minikube-hyperv`;
        if (command === 'start') {
          args.push('--cni=calico');
          args.push('--addons=metallb,ingress-dns');
          args.push('--memory=3072');
        }

        // remove the first argument, and put the commandHyperV as the first argument
        args.shift();
        args.unshift(commandHyperV);
        if (DEBUG) {
          console.log('runFunc 11.1, running commandHyperV:', commandHyperV, args);
        }
        minikube = pluginRunCommand(
          // @ts-ignore
          'scriptjs',
          [`${packagePath}/manage-minikube.js`, ...args],
          {}
        );
      } else if (isVfkit) {
        if (command === 'start') {
          // remove the first argument, and put the 'start-minikube-vfkit' as the first argument
          args.shift();
          args.unshift('start-minikube-vfkit');
          if (DEBUG) {
            console.log('runFunc 11.2, running start-minikube-vfkit:', args);
          }
          args.push('--cni=calico');
          args.push('--container-runtime=containerd');
          args.push('--memory=3072');
          args.push('--addons=metallb,ingress-dns');
          minikube = pluginRunCommand(
            // @ts-ignore
            'scriptjs',
            [`${packagePath}/manage-minikube.js`, ...args],
            {}
          );
        } else {
          minikube = pluginRunCommand('minikube', args, {});
        }
      } else {
        if (driver) {
          args.push('--driver', driver);
        }

        minikube = pluginRunCommand('minikube', args, {});
      }

      const commandInfo: RunningCommandType = {
        clusterName,
        command,
        driver,
        runCommand: minikube,
        exitCode: null,
        stdoutData: [],
        errorData: [],
        allData: [],
        props: props,
      };
      setRunningCommand(commandInfo);
      runningCommandsRef.current.push(commandInfo);

      if (DEBUG) {
        console.log('runFunc 12, after runCommand');
      }
      setRunning(true);

      minikube.stdout.on('data', data => {
        if (DEBUG) {
          console.log('runFunc 13, stdout:', data);
        }

        commandInfo.stdoutData.push(data);
        commandInfo.allData.push(data);
      });
      minikube.stderr.on('data', (data: string) => {
        if (DEBUG) {
          console.log('runFunc 14, stderr:', data);
        }
        commandInfo.errorData.push(data);
        commandInfo.allData.push(data);
      });
      minikube.on('exit', code => {
        if (DEBUG) {
          console.log('runFunc 15, exit code:', code);
        }
        commandInfo.exitCode = code;
        // setCommandDone(true);
      });

      onConfirm();
      if (DEBUG) {
        console.log('runFunc 16, finished');
      }
    }
    if (DEBUG) {
      console.log('runFunc 17, dispatching', clusterName);
    }

    clusterAction(() => runFunc(clusterName), {
      startMessage: `About to ${command} cluster ${clusterName}…`,
      cancelledMessage: `Cancelled ${command} cluster ${clusterName}.`,
      successMessage: `Cluster ${command} of ${clusterName} begun.`,
      errorMessage: `Failed to ${command} ${clusterName}.`,

      cancelCallback: () => {
        setActing(false);
        setRunning(false);
        handleClose();
        setOpenDialog(false);
      },
    });
  }
  const askClusterName = runningCommand
    ? runningCommand.props.askClusterName
    : props.askClusterName;

  if (DEBUG) {
    console.log('CommandCluster 18, ', {
      runningCommand,
      command,
      theCluster,
      acting,
      running,
      commandDone,
    });
  }

  return (
    <>
      <Prompt
        when={!commandDone && running}
        message="The command is still running. If you leave, the command 
may keep running in the background. Leave?"
      />
      <CommandDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          handleClose();
          setActing(false);
          setCommandDone(false);
          setRunningCommand(null);
          //@todo: should this remove the running command?

          // If the runningCommand is not null, and the exitCode is not null,
          if (runningCommand && runningCommand.exitCode !== null) {
            // then we remove it from the runningCommandsRef
            if (DEBUG) {
              console.log('CommandCluster onClose 18, removing running command', runningCommand);
            }
            runningCommandsRef.current = runningCommandsRef.current.filter(
              cmd => cmd !== runningCommand
            );
          }
        }}
        onConfirm={({ clusterName, driver }) => handleRunCommand({ clusterName, driver })}
        command={command}
        title={
          askClusterName
            ? acting
              ? `Creating Minikube Cluster ${theCluster}...`
              : 'Create a New Minikube Cluster'
            : acting
            ? `Running "${command}" on Minikube Cluster`
            : `Running "${command}" on Minikube Cluster`
        }
        acting={acting}
        running={running}
        actingLines={runningLines}
        commandDone={commandDone}
        useGrid={props.useGrid}
        initialClusterName={initialClusterName}
        askClusterName={askClusterName}
        info={info}
      />
    </>
  );
}
