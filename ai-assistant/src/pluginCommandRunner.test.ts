import { describe, expect, it, vi } from 'vitest';
import { createPluginCommandRunner, type PluginCommandProcess } from './pluginCommandRunner';

function createProcess() {
  let exitListener: ((code: number | null) => void) | undefined;
  let dataListener: ((chunk: unknown) => void) | undefined;
  const process: PluginCommandProcess = {
    stdout: {
      on: (_event, listener) => {
        dataListener = listener;
      },
    },
    on: (_event, listener) => {
      exitListener = listener;
    },
    kill: vi.fn(),
  };
  return {
    process,
    emitData: (chunk: unknown) => dataListener?.(chunk),
    emitExit: (code: number | null) => exitListener?.(code),
  };
}

describe('createPluginCommandRunner', () => {
  it('collects stdout and resolves on process exit', async () => {
    const child = createProcess();
    const runner = createPluginCommandRunner(() => child.process);
    const resultPromise = runner('az', ['account', 'show']);

    child.emitData('first');
    child.emitData(' second');
    child.emitExit(0);

    await expect(resultPromise).resolves.toEqual({ stdout: 'first second', exitCode: 0 });
  });

  it('kills and resolves immediately when aborted', async () => {
    const child = createProcess();
    const runner = createPluginCommandRunner(() => child.process);
    const controller = new AbortController();
    const resultPromise = runner('az', ['account', 'list'], controller.signal);

    controller.abort();

    await expect(resultPromise).resolves.toEqual({ stdout: '', exitCode: -1 });
    expect(child.process.kill).toHaveBeenCalledOnce();
    child.emitExit(0);
    await expect(resultPromise).resolves.toEqual({ stdout: '', exitCode: -1 });
  });

  it('resolves when process termination throws', async () => {
    const child = createProcess();
    child.process.kill = vi.fn(() => {
      throw new Error('process already exited');
    });
    const runner = createPluginCommandRunner(() => child.process);
    const controller = new AbortController();
    const resultPromise = runner('az', ['account', 'list'], controller.signal);

    controller.abort();

    await expect(resultPromise).resolves.toEqual({ stdout: '', exitCode: -1 });
    expect(child.process.kill).toHaveBeenCalledOnce();
  });

  it('handles a signal that is already aborted', async () => {
    const child = createProcess();
    const runCommand = vi.fn(() => child.process);
    const runner = createPluginCommandRunner(runCommand);
    const controller = new AbortController();
    controller.abort();

    await expect(runner('az', ['account', 'show'], controller.signal)).resolves.toEqual({
      stdout: '',
      exitCode: -1,
    });
    expect(runCommand).not.toHaveBeenCalled();
  });
});
