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
import type { AuthStatus, Destination } from './common';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';
import type { KnativeResourceClass } from './customResourceLinks';

export const SOURCE_CRD_LABEL_SELECTOR = 'duck.knative.dev/source=true';

/**
 * The fields every Knative Source has, whatever its kind: Knative's Source duck type, which every
 * Source CRD (labelled `duck.knative.dev/source=true`) follows. Fields that only one kind has, such
 * as a PingSource's schedule, are not part of it.
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
  };
  /** The Source's observed state. */
  status?: ConditionedStatus & {
    /** The sink URI the Source currently sends its events to. */
    sinkUri?: string;
    /** The attributes of the CloudEvents the Source sends. */
    ceAttributes?: {
      /** The CloudEvent `type` attribute. */
      type?: string;
      /** The CloudEvent `source` attribute. */
      source?: string;
    }[];
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
export class KnativeSource extends ConditionedKnativeCustomResource<KnativeSourceResource> {
  /**
   * Where the Source sends its events.
   *
   * @returns The sink, or undefined when the Source has none.
   */
  get sink(): Destination | undefined {
    return this.spec?.sink;
  }
}

const sourceClasses = new Map<string, typeof KnativeSource>();

/**
 * Gives the class for the Sources of one kind. The same kind, plural name, scope and API version
 * always give the same class, so a list of that kind keeps its watch while its CRD changes in
 * other ways.
 *
 * @param info - The kind, its plural name, scope and the API version to request. A single API
 * version lets Headlamp request it directly, without first trying several.
 * @returns The class.
 */
export function getKnativeSourceClass(info: KnativeResourceClass): typeof KnativeSource {
  const key = JSON.stringify([info.kind, info.apiName, info.apiVersion, info.isNamespaced]);
  const existing = sourceClasses.get(key);
  if (existing) {
    return existing;
  }

  const sourceClass = class extends KnativeSource {
    static kind = info.kind;
    static apiName = info.apiName;
    static apiVersion = info.apiVersion;
    static isNamespaced = info.isNamespaced;
  };
  sourceClasses.set(key, sourceClass);
  return sourceClass;
}
