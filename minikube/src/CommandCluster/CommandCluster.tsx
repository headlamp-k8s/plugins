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
    askClusterName,
  } = props;
  const [openDialog, setOpenDialog] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [runningLines, setRunningLines] = React.useState<string[]>([]);
  const [commandDone, setCommandDone] = React.useState(false);
  const [theCluster, setTheCluster] = React.useState<string | null>(null);

  const allDataRef = React.useRef<string[]>([]);

  React.useEffect(function updateRunningLines() {
    // Make sure react gets notified of the changes to the array
    const intervalId = setInterval(() => {
      setRunningLines([...allDataRef.current]);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  React.useEffect(() => {
    if (startOpen) {
      setOpenDialog(true);
    }
  }, [startOpen]);

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
      if (DEBUG) {
        console.log('runFunc after runCommand');
      }
      const stdoutData: string[] = [];
      const errorData: string[] = [];
      setRunning(true);

      minikube.stdout.on('data', data => {
        if (DEBUG) {
          console.log('runFunc stdout:', data);
        }
        stdoutData.push(data);
        allDataRef.current.push(data);

        if (data.includes(finishedText)) {
          setCommandDone(true);
        }
      });
      minikube.stderr.on('data', (data: string) => {
        if (DEBUG) {
          console.log('runFunc stderr:', data);
        }
        errorData.push(data);
        allDataRef.current.push(data);
      });
      minikube.on('exit', code => {
        if (DEBUG) {
          console.log('runFunc exit code:', code);
        }
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
