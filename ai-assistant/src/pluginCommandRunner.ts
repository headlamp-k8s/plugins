/** Promise-based command runner with optional cancellation support. */
export type CancellableCommandRunner = (
  command: string,
  args: string[],
  signal?: AbortSignal
) => Promise<{ stdout: string; exitCode: number }>;

/** Event-emitting process returned by Headlamp's injected plugin command runner. */
export interface PluginCommandProcess {
  /** Captured standard-output stream. */
  stdout: {
    /** Registers a standard-output listener. */
    on: (event: 'data', listener: (chunk: unknown) => void) => void;
  };
  /** Registers a process-exit listener. */
  on: (event: 'exit', listener: (code: number | null) => void) => void;
  /** Terminates the process when supported by the host. */
  kill?: () => void;
}

/** Function that starts a command through Headlamp's injected plugin API. */
export type PluginRunCommand = (
  command: string,
  args: string[],
  options: Record<string, unknown>
) => PluginCommandProcess;

/**
 * Adapts Headlamp's event-emitting command API to the promise-based detector API.
 *
 * @param runCommand - Injected Headlamp command launcher.
 * @returns A command runner that collects stdout and always settles on exit or abort.
 */
export function createPluginCommandRunner(runCommand: PluginRunCommand): CancellableCommandRunner {
  return (command, args, signal) => {
    if (signal?.aborted) {
      return Promise.resolve({ stdout: '', exitCode: -1 });
    }

    return new Promise(resolve => {
      const process = runCommand(command, args, {});
      let stdout = '';
      let settled = false;

      const settle = (exitCode: number): void => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        resolve({ stdout, exitCode });
      };
      const abort = (): void => {
        settle(-1);
        try {
          process.kill?.();
        } catch {
          // Process termination is best-effort after the command promise settles.
        }
      };

      process.stdout.on('data', chunk => (stdout += String(chunk)));
      process.on('exit', code => settle(code ?? -1));
      signal?.addEventListener('abort', abort, { once: true });
    });
  };
}
