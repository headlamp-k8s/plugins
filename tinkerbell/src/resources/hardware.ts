import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_API_VERSION, TinkerbellCondition, TinkerbellResource } from './common';

export const HARDWARE_CRD_NAME = 'hardware.tinkerbell.org';

export interface HardwareDisk {
  device?: string;
  wipeTable?: boolean;
}

export interface HardwareInterface {
  dhcp?: {
    arch?: string;
    hostname?: string;
    leaseTime?: number;
    mac?: string;
    nameServers?: string[];
    uefi?: boolean;
    ip?: {
      address?: string;
      gateway?: string;
      netmask?: string;
    };
  };
  netboot?: {
    allowPXE?: boolean;
    allowWorkflow?: boolean;
    ipxe?: {
      url?: string;
      contents?: string;
    };
    osie?: {
      baseURL?: string;
    };
  };
}

export interface HardwareSpec {
  agentID?: string;
  disks?: HardwareDisk[];
  interfaces?: HardwareInterface[];
  metadata?: Record<string, any>;
  userData?: string;
  vendorData?: string;
}

export interface HardwareStatus {
  conditions?: TinkerbellCondition[];
  state?: string;
}

export interface TinkerbellHardware extends TinkerbellResource {
  spec?: HardwareSpec;
  status?: HardwareStatus;
}

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
