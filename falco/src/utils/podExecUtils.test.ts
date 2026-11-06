import { cancelPodExec } from './podExecUtils';

describe('cancelPodExec', () => {
  it('should cancel an active pod exec result', () => {
    const cancel = vi.fn();

    cancelPodExec({ cancel });

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('should tolerate a missing exec result', () => {
    expect(() => cancelPodExec(null)).not.toThrow();
  });

  it('should tolerate an exec result without cancel', () => {
    expect(() => cancelPodExec({ getSocket: () => null })).not.toThrow();
  });
});
