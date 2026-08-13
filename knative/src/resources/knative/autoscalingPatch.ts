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

export type AutoscalingParams = {
  metric?: 'concurrency' | 'rps' | null;
  target?: number | null;
  targetUtilization?: number | null;
  containerConcurrency?: number | null;
  minScale?: number | null;
  maxScale?: number | null;
  initialScale?: number | null;
  activationScale?: number | null;
  scaleDownDelay?: string | null;
  stableWindow?: string | null;
};

export type AutoscalingPatchBody = {
  spec: {
    template: {
      metadata?: {
        name?: string | null;
        annotations?: Record<string, string | null>;
      };
      spec?: {
        containerConcurrency?: number | null;
      };
    };
  };
};

export function buildAutoscalingPatch(params: AutoscalingParams): AutoscalingPatchBody | null {
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

  const annotationSources: Record<string, string | number | null | undefined> = {
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

  const annotationsPatch: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(annotationSources)) {
    if (typeof value === 'undefined') {
      continue;
    }
    annotationsPatch[key] = value === null ? null : String(value);
  }

  const templateSpecPatch: { containerConcurrency?: number | null } = {};
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
        metadata: {
          name: null as any,
          ...(hasAnnotationsPatch ? { annotations: annotationsPatch } : {}),
        },
        ...(hasTemplateSpecPatch ? { spec: templateSpecPatch } : {}),
      },
    },
  };
}
