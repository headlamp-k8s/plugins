import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kmeshRoutePaths } from '../utils/kmeshRoutes';

/**
 * Specification for the KmeshNodeInfo CRD.
 * Describes per-node IPsec security state managed by the Kmesh IPsec controller.
 * @see kmesh/pkg/kube/apis/kmeshnodeinfo/v1alpha1/types.go
 * @see kmesh/deploy/yaml/crd/kmesh.net_kmeshnodeinfos.yaml
 */
export interface KmeshNodeInfoSpec {
  /**
   * The SPI (Security Parameter Index) identifies the current IPsec key version.
   * All nodes must agree on the same SPI for IPsec tunnels to function correctly.
   * A mismatch means a node has a stale key and cannot communicate securely.
   */
  spi: number;
  /**
   * Internal IP addresses of this node used to determine which network adapter
   * is used to encrypt and send IPsec data.
   */
  addresses: string[];
  /**
   * Node boot ID used to generate the IPsec key. Changes on every node reboot,
   * triggering an automatic key rotation by the Kmesh IPsec controller.
   */
  bootID: string;
  /**
   * Pod CIDRs on this node. IPsec uses this to determine which traffic
   * needs to be encrypted (destinations within these ranges go through IPsec).
   */
  podCIDRS: string[];
}

/**
 * Raw Kubernetes object interface for the KmeshNodeInfo CRD.
 */
export interface KubeKmeshNodeInfo extends KubeObjectInterface {
  spec?: KmeshNodeInfoSpec;
}

/**
 * Headlamp KubeObject class for the KmeshNodeInfo CRD.
 * Manages per-node IPsec security state in a Kmesh-enabled cluster.
 * Group/Version/Resource: kmesh.net/v1alpha1/kmeshnodeinfos
 * Scope: Namespaced (lives in kmesh-system namespace)
 */
export class KmeshNodeInfo extends KubeObject<KubeKmeshNodeInfo> {
  static kind = 'KmeshNodeInfo';
  static apiName = 'kmeshnodeinfos';
  static apiVersion = 'kmesh.net/v1alpha1';
  static isNamespaced = true;

  static get detailsRoute() {
    return kmeshRoutePaths.nodeInfoDetail;
  }

  get spec() {
    return this.jsonData.spec;
  }

  /** IPsec key version number. Must match across all nodes in the cluster. */
  get spi() {
    return this.spec?.spi ?? 0;
  }

  /** Node IP addresses used for IPsec tunnel termination. */
  get addresses() {
    return this.spec?.addresses ?? [];
  }

  /** Pod CIDRs managed by this node, used for IPsec routing decisions. */
  get podCIDRS() {
    return this.spec?.podCIDRS ?? [];
  }

  /** Boot ID used for IPsec key generation; changes on every reboot. */
  get bootID() {
    return this.spec?.bootID ?? '';
  }
}
