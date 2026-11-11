/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { KnativeListRouteName } from '../../navigation';
import type { AuthStatus, Destination } from './common';
import type { ConditionedStatus } from './conditionedResource';
import type { KnativeResourceClass } from './customResourceLinks';
import { KNATIVE_SOURCE_KINDS } from './eventingData';
import { type DiscoveredKindFamily, DiscoveredKindResource, getKindClass } from './kindClass';

/** The attributes of the CloudEvents a Source sends, as the Source reports them. */
export interface SourceCloudEventAttributes {
  /** The CloudEvent `type` attribute. */
  type?: string;
  /** The CloudEvent `source` attribute. */
  source?: string;
}

/**
 * The fields every Knative Source has, whatever its kind: Knative's Source duck type, which every
 * Source CRD (labelled `duck.knative.dev/source=true`) follows. Each kind adds its own settings to
 * the spec, such as a PingSource's schedule.
 */
interface KnativeSourceResource extends KubeObjectInterface {
  /** The Source's desired state. */
  spec?: {
    /** Where the Source sends its events: a reference that resolves to a URI, a URI, or both. */
    sink?: Destination;
    /** Changes the Source makes to the CloudEvents it sends. */
    ceOverrides?: {
      /**
       * Attributes added to, or replaced on, every event the Source sends; each key-value pair is
       * set on the event as its own extension attribute.
       */
      extensions?: Record<string, string>;
    };
    /** The settings of the Source's own kind, such as a PingSource's `schedule`. */
    [setting: string]: unknown;
  };
  /** The Source's observed state. */
  status?: ConditionedStatus & {
    /** The sink URI the Source currently sends its events to. */
    sinkUri?: string;
    /** The attributes of the CloudEvents the Source sends. */
    ceAttributes?: SourceCloudEventAttributes[];
    /** The sink's Certification Authority (CA) certificates, in PEM format (RFC 7468). */
    sinkCACerts?: string;
    /** The OIDC audience of the sink. */
    sinkAudience?: string;
    /** The service accounts generated for the Source. */
    auth?: AuthStatus;
  };
}

/**
 * A Knative Source of any kind. `getKnativeSourceClass` derives one class per kind of Source, so
 * the same type serves every kind.
 */
export class KnativeSource extends DiscoveredKindResource<KnativeSourceResource> {
  /**
   * The plugin route that shows one Source.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeSourceDetails';
  }

  /**
   * The plugin route that lists Sources.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeSources';
  }

  /**
   * Where the Source sends its events.
   *
   * @returns The sink, or undefined when the Source has none.
   */
  get sink(): Destination | undefined {
    return this.spec?.sink;
  }

  /**
   * The rest of the Source's spec, as written: the settings of its own kind and the changes it
   * makes to its events.
   *
   * @returns Everything in the spec but the sink, or undefined when there is nothing else.
   */
  get settings(): Record<string, unknown> | undefined {
    return this.getSpecWithout('sink');
  }
}

const sourceClasses = new Map<string, typeof KnativeSource>();

/**
 * Gives the class for the Sources of one kind, the same class each time for the same kind.
 *
 * @param info - The kind, its plural name, scope and the API version to request. A single API
 * version lets Headlamp request it directly, without first trying several.
 * @returns The class.
 */
export function getKnativeSourceClass(info: KnativeResourceClass): typeof KnativeSource {
  return getKindClass(
    sourceClasses,
    info,
    () =>
      class extends KnativeSource {
        static kind = info.kind;
        static apiName = info.apiName;
        static apiVersion = info.apiVersion;
        static isNamespaced = info.isNamespaced;
      }
  );
}

export const SOURCE_FAMILY: DiscoveredKindFamily<typeof KnativeSource> = {
  labelKey: 'duck.knative.dev/source',
  fallbackKinds: KNATIVE_SOURCE_KINDS,
  getKindClass: getKnativeSourceClass,
};
