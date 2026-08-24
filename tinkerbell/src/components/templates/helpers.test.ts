import { parseTemplateData } from './helpers';

describe('parseTemplateData', () => {
  it('returns an empty summary when data is absent', () => {
    expect(parseTemplateData(undefined)).toEqual({ tasks: [], actions: [], images: [] });
  });

  it('does not attribute a later action image/timeout to a short action', () => {
    // The first action has neither an image nor a timeout of its own, and is
    // immediately followed by a second action that has both. A fixed-size
    // lookahead window past the first action's own lines would read the
    // second action's fields as if they belonged to the first.
    const data = `
version: "0.1"
name: demo
tasks:
  - name: "provision"
    worker: "{{.device_1}}"
    actions:
      - name: "no-op"
      - name: "stream-image"
        image: quay.io/tinkerbell-actions/image2disk:v1.0.0
        timeout: 600
`;

    const { actions } = parseTemplateData(data);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ name: 'no-op', image: undefined, timeout: undefined });
    expect(actions[1]).toMatchObject({
      name: 'stream-image',
      image: 'quay.io/tinkerbell-actions/image2disk:v1.0.0',
      timeout: '600',
    });
  });

  it('reads image and timeout regardless of how many lines an action spans', () => {
    const data = `
tasks:
  - name: "provision"
    actions:
      - name: "configure"
        environment:
          ONE: "1"
          TWO: "2"
          THREE: "3"
          FOUR: "4"
          FIVE: "5"
          SIX: "6"
        image: quay.io/tinkerbell-actions/cexec:v1.0.0
        timeout: 90
`;

    const { actions } = parseTemplateData(data);

    expect(actions).toEqual([
      {
        taskName: 'provision',
        name: 'configure',
        image: 'quay.io/tinkerbell-actions/cexec:v1.0.0',
        timeout: '90',
      },
    ]);
  });

  it('parses tasks, top-level task count, and conditional action alternatives', () => {
    const data = `
name: demo
global_timeout: 1800
tasks:
  - name: "provision"
    worker: "{{.device_1}}"
    volumes:
      - /dev:/dev
      - /lib/firmware:/lib/firmware:ro
    actions:
      - name: "stream-image"
        image: quay.io/tinkerbell-actions/image2disk:v1.0.0
        timeout: 600
      {{if .arch_arm64}}
      - name: "kexec-arm64"
      {{else}}
      - name: "kexec-amd64"
      {{end}}
`;

    const parsed = parseTemplateData(data);

    expect(parsed.name).toBe('demo');
    expect(parsed.globalTimeout).toBe('1800');
    expect(parsed.tasks).toEqual([
      { name: 'provision', worker: '{{.device_1}}', actionCount: 2, volumeCount: 2 },
    ]);
    expect(parsed.actions[1]).toMatchObject({
      name: 'kexec-arm64 / kexec-amd64',
      alternatives: ['kexec-arm64', 'kexec-amd64'],
      condition: '.arch_arm64',
    });
    expect(parsed.images).toEqual(['quay.io/tinkerbell-actions/image2disk:v1.0.0']);
  });
});
