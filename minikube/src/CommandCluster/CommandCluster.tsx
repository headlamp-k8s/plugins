import { clusterAction, runCommand } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { Prompt } from 'react-router-dom';
import CommandDialog from './CommandDialog';

const DEBUG = true;

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
  const allDataRef = React.useRef<string[]>([]);
  const runningCommandsRef = React.useRef<RunningCommandType[]>(commandsRunning);
  const [runningCommand, setRunningCommand] = React.useState<RunningCommandType | null>(null);

  if (DEBUG) {
    console.log('CommandCluster runningCommand props:', props, runningCommandsRef.current, runningCommand);
  }

  React.useEffect(function updateRunningLines() {
    // Make sure react gets notified of the changes to the array
    const intervalId = setInterval(() => {
      setRunningLines([...allDataRef.current]);
      if(runningCommand && runningCommand.exitCode !== null) {
        if (DEBUG) {
          console.log('CommandCluster setting command done');
        }
        setCommandDone(true);
      }

    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  // If runningCommandsRef is not [] empty then we set the runningCommand to the last one
  React.useEffect(() => {
    if (runningCommandsRef.current.length > 0) {
      if (DEBUG) {
        console.log('CommandCluster useEffect setting running command from runningCommandsRef', runningCommandsRef.current[runningCommandsRef.current.length - 1]);
        console.log('CommandCluster useEffect runningCommandsRef:', runningCommandsRef.current);
      }
      setRunningCommand(runningCommandsRef.current[runningCommandsRef.current.length - 1]);
    }
  }, [runningCommandsRef.current]);

  React.useEffect(() => {
    if (startOpen) {
      setOpenDialog(true);
    }
  }, [startOpen]);


  
  React.useEffect(() => {
    if(runningCommand && runningCommand.exitCode !== null) {
      if (DEBUG) {
        console.log('CommandCluster setting command done');
      }
      setCommandDone(true);
    }
  }, [runningCommand && runningCommand.exitCode]);


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

  React.useEffect(() => {
    if (DEBUG) {
      console.log('CommandCluster useEffect running', runningCommand);
    }
    if (runningCommand && runningCommand.command && runningCommand.props.command === command) {
      setRunningCommand(runningCommand);
      setOpenDialog(true);
      setActing(true);
      setRunning(true);
      setCommandDone(false);
      setTheCluster(runningCommand.clusterName);
      allDataRef.current = runningCommand.allData;
      if (DEBUG) {
        console.log('CommandCluster useEffect setting running command', runningCommand);
      }
      runningCommandsRef.current.push(runningCommand);

    } else {
      // If there is no running command, we reset the state
      setOpenDialog(false);
      setActing(false);
      setRunning(false);
      setCommandDone(false);
      setTheCluster(null);
      allDataRef.current = [];
      if (DEBUG) {
        console.log('CommandCluster useEffect resetting running command', runningCommand);
      }
      // runningCommandsRef.current = runningCommandsRef.current.filter(cmd => cmd !== runningCommand);
    }
  }, [runningCommand, command, onCommandStarted, setRunningCommand]);

  function handleRunCommand({ clusterName, driver }: { clusterName: string; driver: string }) {
    if (DEBUG) {
      console.log('runFunc handleSave', clusterName);
    }
    setTheCluster(clusterName);
    setActing(true);
    onCommandStarted && onCommandStarted();


    function runFunc(clusterName: string) {
      if (DEBUG) {
        console.log('runFunc', clusterName);
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
        console.log('runFunc after runCommand');
      }
      setRunning(true);

      minikube.stdout.on('data', data => {
        if (DEBUG) {
          console.log('runFunc stdout:', data);
        }
        commandInfo.stdoutData.push(data);
        commandInfo.allData.push(data);
        allDataRef.current.push(data);

        if (data.includes(finishedText)) {
          setCommandDone(true);
        }
      });
      minikube.stderr.on('data', (data: string) => {
        if (DEBUG) {
          console.log('runFunc stderr:', data);
        }
        commandInfo.errorData.push(data);
        commandInfo.allData.push(data);
        allDataRef.current.push(data);
      });
      minikube.on('exit', code => {
        if (DEBUG) {
          console.log('runFunc exit code:', code);
        }
        commandInfo.exitCode = code;
        setCommandDone(true);
      });

      onConfirm();
      if (DEBUG) {
        console.log('runFunc finished');
      }
    }
    if (DEBUG) {
      console.log('runFunc dispatching', clusterName);
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
  const askClusterName = runningCommand ? runningCommand.props.askClusterName : props.askClusterName;

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
          allDataRef.current = [];
          setActing(false);
          setCommandDone(false);
          setRunningCommand(null);
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
