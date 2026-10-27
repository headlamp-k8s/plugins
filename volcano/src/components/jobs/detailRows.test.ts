import { TaskSpec } from '../../resources/job';
import { getTaskRows } from './detailRows';

// The Go API marks `replicas` as omitempty, so a task with 0 replicas has no such field.
const zeroReplicaTask = { name: 'worker', template: {} } as unknown as TaskSpec;

describe('getTaskRows', () => {
  it('shows 0 replicas when the replicas field is missing', () => {
    const rows = getTaskRows(zeroReplicaTask, 0);

    expect(rows.find(row => row.name === 'Replicas')?.value).toBe(0);
  });

  it('defaults Min Available to 0 when replicas and minAvailable are missing', () => {
    const rows = getTaskRows(zeroReplicaTask, 0);

    expect(rows.find(row => row.name === 'Min Available')?.value).toBe(0);
  });
});
