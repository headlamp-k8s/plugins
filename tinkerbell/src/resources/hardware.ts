import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  NamespacedObjectReference,
  TINKERBELL_API_VERSION,
  TinkerbellCondition,
  TinkerbellResource,
} from './common';

/** Fully qualified CRD name for Tinkerbell Hardware resources. */
export const HARDWARE_CRD_NAME = 'hardware.tinkerbell.org';

/**
 * Disk configuration for a physical machine.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_hardware.yaml
 */
export interface HardwareDisk {
  /** Device path, for example /dev/sda. */
  device?: string;

  /** Whether Tinkerbell should wipe the partition table. */
  wipeTable?: boolean;
}

/**
 * Network interface configuration used for DHCP and netboot.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_hardware.yaml
 */
export interface HardwareInterface {
  /** DHCP settings used when a target machine asks for network boot details. */
  dhcp?: {
    /** CPU architecture reported to DHCP or workflow logic. */
    arch?: string;

    /** Hostname assigned to the machine. */
    hostname?: string;

    /** Lease time in seconds. */
    leaseTime?: number;

    /** MAC address for this interface. */
    mac?: string;

    /** DNS name servers. */
    nameServers?: string[];

    /** Whether UEFI boot is enabled. */
    uefi?: boolean;

    /** Static IP information, when present. */
    ip?: {
      /** IP address assigned to the interface. */
      address?: string;

      /** Default gateway address. */
      gateway?: string;

      /** Network mask. */
      netmask?: string;
    };

    /** Raw snake_case fields accepted by the v0.23.0 CRD. */
    [key: string]: any;
  };

  /** Netboot and workflow boot settings. */
  netboot?: {
    /** Whether PXE boot is allowed for this interface. */
    allowPXE?: boolean;

    /** Whether workflow-controlled netboot is allowed. */
    allowWorkflow?: boolean;

    /** iPXE script settings. */
    ipxe?: {
      /** URL for the iPXE script. */
      url?: string;

      /** Inline iPXE script contents. */
      contents?: string;

      /** Binary name used by the v0.23.0 CRD. */
      binary?: string;
    };

    /** Operating system installation environment settings. */
    osie?: {
      /** Base URL for OSIE assets. */
      baseURL?: string;

      /** Initrd asset used by the v0.23.0 CRD. */
      initrd?: string;

      /** Kernel asset used by the v0.23.0 CRD. */
      kernel?: string;
    };
  };
}

/**
 * Desired configuration for a Tinkerbell Hardware object.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_hardware.yaml
 */
export interface HardwareSpec {
  /** Agent identifier used to match the target machine. */
  agentID?: string;

  /** Automatic enrollment settings. */
  auto?: {
    /** Whether automatic enrollment is enabled. */
    enrollmentEnabled?: boolean;
  };

  /** Reference to a BMC Machine object, when BMC integration is used. */
  bmcRef?: NamespacedObjectReference & {
    /** API group for the referenced BMC resource. */
    apiGroup?: string;

    /** Kind for the referenced BMC resource. */
    kind?: string;
  };

  /** Disk configuration for the target machine. */
  disks?: HardwareDisk[];

  /** Network interface configuration for the target machine. */
  interfaces?: HardwareInterface[];

  /** Free-form metadata used by templates and operators. */
  metadata?: Record<string, any>;

  /** Additional object references associated with this hardware. */
  references?: Record<string, any>;

  /** Resource hints or inventory information. */
  resources?: Record<string, any>;

  /** Tinkerbell hardware schema version. */
  tinkVersion?: number;

  /** Cloud-init user data or equivalent bootstrap data. */
  userData?: string;

  /** Vendor data passed to the target machine. */
  vendorData?: string;
}

/** Observed status for a Tinkerbell Hardware object. */
export interface HardwareStatus {
  /** Condition list reported by Tinkerbell controllers, when available. */
  conditions?: TinkerbellCondition[];

  /** Current hardware state. */
  state?: string;
}

/** Kubernetes object shape for a Tinkerbell Hardware resource. */
export interface TinkerbellHardware extends TinkerbellResource {
  /** Desired hardware configuration. */
  spec?: HardwareSpec;

  /** Observed hardware status. */
  status?: HardwareStatus;
}

/**
 * Headlamp resource model for Tinkerbell Hardware.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_hardware.yaml
 */
export class Hardware extends KubeObject<TinkerbellHardware> {
  static readonly apiName = 'hardware';
  static readonly apiVersion = TINKERBELL_API_VERSION;
  static readonly crdName = HARDWARE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Hardware';

  static get detailsRoute() {
    return '/tinkerbell/hardware/:namespace/:name';
  }

  get spec(): HardwareSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): HardwareStatus | undefined {
    return this.jsonData.status;
  }

  get conditions(): TinkerbellCondition[] | undefined {
    return this.status?.conditions;
  }
}
