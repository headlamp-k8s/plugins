import Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';

/**
 * Service for executing commands in Kubernetes pods with improved error handling
 */
export class PodExecService {
  /**
   * Execute a command in a pod and return the output.
   * Handles various data types returned by the exec API.
   *
   * @param pod - The pod to execute the command in
   * @param containerName - The container name to execute the command in
   * @param command - The command to execute as an array of strings
   * @param options - Additional options (tty, etc)
   * @returns The command output as a string
   */
  static async execCommand(
    pod: Pod,
    containerName: string,
    command: string[],
    options: { tty?: boolean } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let output = '';
      let settled = false;

      const execResult = pod.exec(
        containerName,
        (data: string | Uint8Array | ArrayBuffer | { data?: string | Uint8Array }) => {
          if (typeof data === 'string') output += data;
          else if (typeof (data as any)?.data === 'string') output += (data as any).data;
          else if (data instanceof Uint8Array) output += new TextDecoder('utf-8').decode(data);
          else if (data instanceof ArrayBuffer)
            output += new TextDecoder('utf-8').decode(new Uint8Array(data));
          else if ((data as any)?.data instanceof Uint8Array)
            output += new TextDecoder('utf-8').decode((data as any).data);
        },
        {
          command,
          ...options,
        }
      );

      const socket = execResult.getSocket();
      if (socket) {
        socket.addEventListener('close', () => {
          if (!settled) {
            settled = true;
            resolve(output);
          }
        });
        socket.addEventListener('error', (e: unknown) => {
          if (!settled) {
            settled = true;
            console.error(`Exec error in pod ${pod.metadata?.name}:`, e);
            reject(new Error(`Failed to execute command: ${command.join(' ')}`));
          }
        });
      } else {
        // If no socket is available, resolve after a short delay
        setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(output);
          }
        }, 500);
      }
    });
  }

  /**
   * Reads a file from a pod with fallback handling for tty options
   *
   * @param pod - The pod to read from
   * @param filePath - The file path to read
   * @returns The file contents
   */
  static async readFile(pod: Pod, filePath: string): Promise<string> {
    try {
      // First try with tty=true (default)
      return await PodExecService.execCommand(
        pod,
        pod.spec?.containers?.[0]?.name || 'falco',
        ['cat', filePath],
        { tty: true }
      );
    } catch (error) {
      // Fallback to tty=false if the first attempt fails
      return await PodExecService.execCommand(
        pod,
        pod.spec?.containers?.[0]?.name || 'falco',
        ['cat', filePath],
        { tty: false }
      );
    }
  }
}
