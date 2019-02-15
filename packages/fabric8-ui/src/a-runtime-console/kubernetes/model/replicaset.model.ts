import { ReplicationController, ReplicationControllers } from './replicationcontroller.model';
import { ScalableResource } from './scalableresource.model';

export class ReplicaSet extends ScalableResource {
  defaultKind() {
    return 'ReplicaSet';
  }
}

export class ReplicaSets extends Array<ReplicaSet> {}

/**
 * Combines ReplicaSets and ReplicationControllers into a list removing any duplicates
 */
export function combineReplicaSets(
  replicasets: ReplicaSets,
  replicationControllers: ReplicationControllers,
): ReplicaSets {
  const map = {};
  if (replicationControllers) {
    replicationControllers.forEach((s) => (map[s.name] = s));
  }
  if (replicasets) {
    replicasets.forEach((s) => (map[s.name] = s));
  }
  const answer = new ReplicaSets();
  for (const key in map) {
    if (key && map[key]) {
      answer.push(map[key]);
    }
  }

  answer.sort((a: ReplicaSet, b: ReplicaSet) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  return answer;
}

/**
 * Combines ReplicaSets and ReplicationControllers into a list removing any duplicates
 */
export function combineReplicaSet(
  replicaset: ReplicaSet,
  replicationController: ReplicationController,
): ReplicaSet {
  if (replicaset && replicaset.resource) {
    return replicationController && replicationController.resource
      ? replicationController
      : replicaset;
  }
  return replicationController;
}
