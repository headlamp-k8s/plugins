/*
 * Copyright 2025 The Kubernetes Authors
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

import {
  KubeContainerProbe,
  KubeObject,
  type KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Condition } from './common';

export type Traffic = {
  percent: number;
  revisionName?: string;
  latestRevision?: boolean;
  configurationName?: string;
  tag?: string;
  url?: string;
};

type AutoscalingParams = {
  metric?: 'concurrency' | 'rps';
  target?: number;
  targetUtilization?: number;
  containerConcurrency?: number;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  activationScale?: number;
  scaleDownDelay?: string;
  stableWindow?: string;
};

type AutoscalingPatchBody = {
  spec: {
    template: {
      metadata?: {
        annotations: Record<string, string>;
      };
      spec?: {
        containerConcurrency?: number;
      };
    };
  };
};

interface KServiceResource extends KubeObjectInterface {
  spec: {
    traffic?: Traffic[];
    template: {
      metadata?: {
        annotations?: Record<string, string>;
        labels?: Record<string, string>;
        finalizers?: string[];
        name?: string;
        namespace?: string;
      };
      spec: {
        containerConcurrency?: number;
        containers: Array<{
          name?: string;
          image: string;
          args?: string[];
          command?: string[];
          env?: Array<{
            name: string;
            value?: string;
          }>;
          envFrom?: Array<{
            configMapRef?: { name?: string; optional?: boolean };
            secretRef?: { name?: string; optional?: boolean };
            prefix?: string;
          }>;
          imagePullPolicy?: string;
          readinessProbe?: KubeContainerProbe;
          livenessProbe?: KubeContainerProbe;
          ports: Array<{
            containerPort: number;
            name?: string;
            protocol?: string;
          }>;
          resources?: {
            limits?: Record<string, string>;
            requests?: Record<string, string>;
          };
        }>;
        imagePullSecrets?: Array<{ name?: string }>;
        nodeSelector?: Record<string, string>;
        topologySpreadConstraints?: Array<{
          maxSkew: number;
          topologyKey: string;
          whenUnsatisfiable: string;
          labelSelector?: {
            matchLabels?: Record<string, string>;
          };
        }>;
        serviceAccountName?: string;
        timeoutSeconds?: number;
        idleTimeoutSeconds?: number;
        responseStartTimeoutSeconds?: number;
      };
    };
  };
  status?: {
    url?: string;
    address?: {
      url?: string;
      name?: string;
      audience?: string;
      CACerts?: string;
    };
    annotations?: Record<string, string>;
    latestCreatedRevisionName?: string;
    latestReadyRevisionName?: string;
    observedGeneration?: number;
    conditions?: Condition[];
    traffic?: Traffic[];
  };
}

export class KService extends KubeObject<KServiceResource> {
  static kind = 'Service';
  static apiName = 'services';
  static apiVersion = 'serving.knative.dev/v1';
  static isNamespaced = true;

  static get detailsRoute(): string {
    return '/knative/services/:namespace/:name';
  }

  static get listRoute(): string {
    return '/knative/services';
  }

  static buildAutoscalingPatch(params: AutoscalingParams): AutoscalingPatchBody | null {
    const {
      metric,
      target,
      targetUtilization,
      minScale,
      maxScale,
      initialScale,
      activationScale,
      scaleDownDelay,
      stableWindow,
      containerConcurrency,
    } = params;

    const annotationSources: Record<string, string | number | undefined> = {
      'autoscaling.knative.dev/metric': metric,
      'autoscaling.knative.dev/target': target,
      'autoscaling.knative.dev/target-utilization-percentage': targetUtilization,
      'autoscaling.knative.dev/min-scale': minScale,
      'autoscaling.knative.dev/max-scale': maxScale,
      'autoscaling.knative.dev/initial-scale': initialScale,
      'autoscaling.knative.dev/activation-scale': activationScale,
      'autoscaling.knative.dev/scale-down-delay': scaleDownDelay,
      'autoscaling.knative.dev/window': stableWindow,
    };

    const annotationsPatch: Record<string, string> = {};
    for (const [key, value] of Object.entries(annotationSources)) {
      if (typeof value === 'undefined') {
        continue;
      }
      annotationsPatch[key] = String(value);
    }

    const templateSpecPatch: { containerConcurrency?: number } = {};
    if (typeof containerConcurrency !== 'undefined') {
      templateSpecPatch.containerConcurrency = containerConcurrency;
    }

    const hasAnnotationsPatch = Object.keys(annotationsPatch).length > 0;
    const hasTemplateSpecPatch = Object.keys(templateSpecPatch).length > 0;

    if (!hasAnnotationsPatch && !hasTemplateSpecPatch) {
      return null;
    }

    return {
      spec: {
        template: {
          ...(hasAnnotationsPatch ? { metadata: { annotations: annotationsPatch } } : {}),
          ...(hasTemplateSpecPatch ? { spec: templateSpecPatch } : {}),
        },
      },
    };
  }

  static getBaseObject(): KServiceResource {
    const baseObject = super.getBaseObject() as KServiceResource;

    return {
      ...baseObject,
      metadata: {
        ...baseObject.metadata,
        name: 'sample-internal-app',
        namespace: 'default',
      },
      spec: {
        template: {
          metadata: {
            annotations: {
              'autoscaling.knative.dev/min-scale': '0',
            },
            labels: {
              'networking.knative.dev/visibility': 'cluster-local',
            },
          },
          spec: {
            containers: [
              {
                name: 'user-container',
                image: 'gcr.io/knative-samples/helloworld-go',
                env: [
                  {
                    name: 'TARGET',
                    value: 'Go Sample v1',
                  },
                ],
                readinessProbe: {
                  httpGet: {
                    path: '/healthz',
                    port: 8080,
                    scheme: 'HTTP',
                  },
                },
                livenessProbe: {
                  httpGet: {
                    path: '/healthz',
                    port: 8080,
                    scheme: 'HTTP',
                  },
                },
                imagePullPolicy: 'IfNotPresent',
                ports: [
                  {
                    containerPort: 8080,
                    name: 'http1',
                    protocol: 'TCP',
                  },
                ],
                resources: {
                  limits: {
                    cpu: '2',
                    memory: '4Gi',
                  },
                  requests: {
                    cpu: '2',
                    memory: '4Gi',
                  },
                },
              },
            ],
            imagePullSecrets: [],
            nodeSelector: {
              'kubernetes.io/arch': 'amd64',
              'kubernetes.io/os': 'linux',
            },
            topologySpreadConstraints: [
              {
                maxSkew: 1,
                topologyKey: 'kubernetes.io/hostname',
                whenUnsatisfiable: 'DoNotSchedule',
                labelSelector: {
                  matchLabels: {
                    'serving.knative.dev/service': 'sample-internal-app',
                  },
                },
              },
            ],
          },
        },
      },
    };
  }

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get url(): string | undefined {
    return this.status?.url || this.status?.address?.url;
  }

  get isReady(): boolean {
    return this.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True';
  }
}
