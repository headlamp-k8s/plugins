import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { VolcanoQueue } from './queue';

/**
 * Volcano bus actions used by queue open/close operations.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/bus/v1alpha1/actions.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/operate.go
 */
export type VolcanoQueueCommandAction = 'OpenQueue' | 'CloseQueue';

/**
 * Namespace used by `vcctl queue operate` when creating queue Command objects.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/util.go
 */
export const QUEUE_COMMAND_NAMESPACE = 'default';

/**
 * Volcano bus Command resource payload used to target a queue action.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/bus/v1alpha1/commands.go
 */
export interface KubeVolcanoCommand extends KubeObjectInterface {
  /** Action to execute for the target object. */
  action?: string;
  /** Target object reference for this command. */
  target?: {
    apiVersion?: string;
    kind?: string;
    name?: string;
    uid?: string;
    controller?: boolean;
    blockOwnerDeletion?: boolean;
  };
}

/**
 * Kubernetes wrapper for the Volcano bus Command CRD.
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/bus/v1alpha1/commands.go
 * @see https://github.com/volcano-sh/volcano/blob/master/config/crd/volcano/bases/bus.volcano.sh_commands.yaml
 */
export class VolcanoCommand extends KubeObject<KubeVolcanoCommand> {
  static kind = 'Command';
  static apiName = 'commands';
  static apiVersion = 'bus.volcano.sh/v1alpha1';
  static isNamespaced = true;
}

/**
 * Creates a Volcano bus command for queue open/close actions.
 * Mirrors the upstream CLI helper used by `vcctl queue operate`.
 *
 * @param queue Queue targeted by the command.
 * @param action Queue command action to create.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/util.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/operate.go
 * @see https://github.com/volcano-sh/volcano/blob/master/staging/src/volcano.sh/apis/pkg/apis/bus/v1alpha1/commands.go
 */
export async function createQueueCommand(queue: VolcanoQueue, action: VolcanoQueueCommandAction) {
  const name = queue.metadata.name;
  const uid = queue.metadata.uid;

  if (!name || !uid) {
    throw new Error('Queue metadata is incomplete for issuing this command');
  }

  const targetReference = {
    apiVersion: queue.jsonData.apiVersion || VolcanoQueue.apiVersion,
    kind: queue.jsonData.kind || 'Queue',
    name,
    uid,
    controller: true,
    blockOwnerDeletion: true,
  };

  await VolcanoCommand.apiEndpoint.post(
    {
      apiVersion: VolcanoCommand.apiVersion,
      kind: VolcanoCommand.kind,
      metadata: {
        generateName: `${name}-${action.toLowerCase()}-`,
        namespace: QUEUE_COMMAND_NAMESPACE,
        ownerReferences: [targetReference],
      },
      action,
      target: targetReference,
    },
    {},
    queue.cluster
  );
}
