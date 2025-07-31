import { clusterAction, runCommand } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { Prompt } from 'react-router-dom';
import CommandDialog from './CommandDialog';

const DEBUG = false;

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
  /** Text to look for in the output to determine if the command is finished */
  finishedText: string;
  /** Ask for the cluster name. Otherwise the initialClusterName is used. */
  askClusterName?: boolean;
}

// Declare a global function with the same type as runCommand
declare const pluginRunCommand: typeof runCommand;

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
  driver: string | null;
  command: {
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

// Define a type for the context
type RunningCommandContextType = {
  runningCommand: RunningCommandType | null;
  setRunningCommand: React.Dispatch<React.SetStateAction<RunningCommandType | null>>;
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
    finishedText,
  } = props;
  const [openDialog, setOpenDialog] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [runningLines, setRunningLines] = React.useState<string[]>([]);
  const [commandDone, setCommandDone] = React.useState(false);
  const [theCluster, setTheCluster] = React.useState<string | null>(null);
  const runningCommandsRef = React.useRef<RunningCommandType[]>(commandsRunning);
  const [runningCommand, setRunningCommand] = React.useState<RunningCommandType | null>(null);

  if (DEBUG) {
    console.log(
      'CommandCluster 1 runningCommand props:',
      props,
      runningCommandsRef.current,
      runningCommand
    );
  }

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

  // // get all commands that haven't exited yet from commandsRunning where exitCode is null
  // const runningCommands = commandsRunning.filter(cmd => cmd.exitCode === null);
  // const lastRunningCommand = runningCommands.length > 0 ? runningCommands[runningCommands.length - 1] : null;
  // const allLines = lastRunningCommand ? lastRunningCommand.allData : [];

  // React.useEffect(() => {
  //   allDataRef.current = allLines;
  // }, [allLines]);

  // When we load, we want to see if there is a command running already
  // and if so, we want to show the dialog with the output of that command
  // if it matches the command we are about to run. Where finishedText and command are the same.
  // The runningCommands array is used to keep track of the commands that are running.
  // So react

  // React.useEffect(() => {
  //   if (DEBUG) {
  //     console.log('CommandCluster setting state 7, runningCommand', runningCommand);
  //   }
  //   if (runningCommand && runningCommand.command && runningCommand.props.command === command) {
  //     setRunningCommand(runningCommand);
  //     setOpenDialog(true);
  //     setActing(true);
  //     setRunning(true);
  //     setCommandDone(false);
  //     setTheCluster(runningCommand.clusterName);
  //     if (DEBUG) {
  //       console.log('CommandCluster setting state 8, runningCommand', runningCommand);
  //     }

  //   } else {
  //     // If there is no running command, we reset the state
  //     setOpenDialog(false);
  //     setActing(false);
  //     setRunning(false);
  //     setCommandDone(false);
  //     setTheCluster(null);
  //     if (DEBUG) {
  //       console.log('CommandCluster setting state 9, runningCommand', runningCommand);
  //     }
  //     // runningCommandsRef.current = runningCommandsRef.current.filter(cmd => cmd !== runningCommand);
  //   }
  // }, [runningCommand, command, onCommandStarted, setRunningCommand]);

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
      args.push('-p', clusterName);
      if (driver) {
        args.push('--driver', driver);
      }
      const minikube = pluginRunCommand('minikube', args, {});

      const commandInfo: RunningCommandType = {
        clusterName,
        driver,
        command: minikube,
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

        // if (data.includes(finishedText)) {
        //   setCommandDone(true);
        // }
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
      />
    </>
  );
}
