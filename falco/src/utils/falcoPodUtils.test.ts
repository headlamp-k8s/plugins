import { detectFalcoFileOutputPath } from './falcoPodUtils';

describe('detectFalcoFileOutputPath', () => {
  it('should return default path when no pod spec', () => {
    expect(detectFalcoFileOutputPath({})).toBe('/tmp/falco_events.json');
    expect(detectFalcoFileOutputPath(undefined)).toBe('/tmp/falco_events.json');
  });

  it('should return default path when no containers', () => {
    expect(detectFalcoFileOutputPath({ spec: {} })).toBe('/tmp/falco_events.json');
    expect(detectFalcoFileOutputPath({ spec: { containers: [] } })).toBe(
      '/tmp/falco_events.json'
    );
  });

  it('should extract path from container args', () => {
    const podJson = {
      spec: {
        containers: [
          {
            name: 'falco',
            args: ['--some-flag', '--falco.file_output.filename=/var/log/falco.json'],
          },
        ],
      },
    };
    expect(detectFalcoFileOutputPath(podJson)).toBe('/var/log/falco.json');
  });

  it('should extract path from env variable', () => {
    const podJson = {
      spec: {
        containers: [
          {
            name: 'falco',
            env: [{ name: 'FALCO_FILE_OUTPUT_FILENAME', value: '/custom/path.json' }],
          },
        ],
      },
    };
    expect(detectFalcoFileOutputPath(podJson)).toBe('/custom/path.json');
  });

  it('should prefer args over env', () => {
    const podJson = {
      spec: {
        containers: [
          {
            name: 'falco',
            args: ['--falco.file_output.filename=/from-args.json'],
            env: [{ name: 'FALCO_FILE_OUTPUT_FILENAME', value: '/from-env.json' }],
          },
        ],
      },
    };
    expect(detectFalcoFileOutputPath(podJson)).toBe('/from-args.json');
  });

  it('should find the falco container among multiple containers', () => {
    const podJson = {
      spec: {
        containers: [
          { name: 'sidecar', args: [] },
          {
            name: 'falco',
            args: ['--falco.file_output.filename=/falco/events.json'],
          },
        ],
      },
    };
    expect(detectFalcoFileOutputPath(podJson)).toBe('/falco/events.json');
  });

  it('should fall back to first container if no falco container', () => {
    const podJson = {
      spec: {
        containers: [
          {
            name: 'custom',
            args: ['--falco.file_output.filename=/custom/output.json'],
          },
        ],
      },
    };
    expect(detectFalcoFileOutputPath(podJson)).toBe('/custom/output.json');
  });
});
