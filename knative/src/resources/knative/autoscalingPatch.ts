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

/**
 * Autoscaling settings to save on a Knative Service. For each field, a value sets it, `null`
 * removes the current setting, and leaving the field out keeps the current setting.
 */
export type AutoscalingParams = {
  /** The `autoscaling.knative.dev/metric` annotation: what the autoscaler scales on. */
  metric?: 'concurrency' | 'rps' | null;
  /** The `autoscaling.knative.dev/target` annotation: the target value for the metric. */
  target?: number | null;
  /** The `autoscaling.knative.dev/target-utilization-percentage` annotation. */
  targetUtilization?: number | null;
  /** The template's `containerConcurrency`: the most requests one Pod handles at once. */
  containerConcurrency?: number | null;
  /** The `autoscaling.knative.dev/min-scale` annotation: the fewest Pods to run. */
  minScale?: number | null;
  /** The `autoscaling.knative.dev/max-scale` annotation: the most Pods to run. */
  maxScale?: number | null;
  /** The `autoscaling.knative.dev/initial-scale` annotation: Pods a new Revision starts with. */
  initialScale?: number | null;
  /** The `autoscaling.knative.dev/activation-scale` annotation: Pods to start from zero. */
  activationScale?: number | null;
  /** The `autoscaling.knative.dev/scale-down-delay` annotation, for example `15m`. */
  scaleDownDelay?: string | null;
  /** The `autoscaling.knative.dev/window` annotation, for example `60s`. */
  stableWindow?: string | null;
};

/** A merge patch for the revision template of a Knative Service. */
export type AutoscalingPatchBody = {
  /** The Service spec. */
  spec: {
    /** The revision template. */
    template: {
      /** The template's metadata. */
      metadata?: {
        /** `null` clears the template name, so Knative names the next Revision itself. */
        name?: string | null;
        /** Annotations to set; `null` removes one. */
        annotations?: Record<string, string | null>;
      };
      /** The template's spec. */
      spec?: {
        /** The most requests one Pod handles at once; `null` resets it to the cluster default. */
        containerConcurrency?: number | null;
      };
    };
  };
};

/**
 * Turns a numeric annotation field from a form into a patch value.
 *
 * @param prevAnns - The annotations the Service has now.
 * @param key - The annotation the field edits.
 * @param val - The text in the field.
 * @returns The number for a non-empty field. For an empty field, `null` when the annotation is set
 * now, so the patch removes it, and undefined when it is not, so the patch leaves it out.
 */
export function annNumOrClear(
  prevAnns: Record<string, string>,
  key: string,
  val: string
): number | null | undefined {
  return val === '' ? (key in prevAnns ? null : undefined) : Number(val);
}

/**
 * Turns a text annotation field from a form into a patch value.
 *
 * @param prevAnns - The annotations the Service has now.
 * @param key - The annotation the field edits.
 * @param val - The text in the field.
 * @returns The text for a non-empty field. For an empty field, `null` when the annotation is set
 * now, so the patch removes it, and undefined when it is not, so the patch leaves it out.
 */
export function annStrOrClear(
  prevAnns: Record<string, string>,
  key: string,
  val: string
): string | null | undefined {
  return val === '' ? (key in prevAnns ? null : undefined) : val;
}

/**
 * Turns a numeric spec field from a form into a patch value.
 *
 * @param prev - The value the Service has now.
 * @param val - The text in the field.
 * @returns The number for a non-empty field. For an empty field, `null` when a value is set now,
 * so the patch removes it, and undefined when it is not, so the patch leaves it out.
 */
export function specNumOrClear(prev: number | undefined, val: string): number | null | undefined {
  return val === '' ? (typeof prev === 'number' ? null : undefined) : Number(val);
}

/**
 * Builds the merge patch that saves autoscaling settings on a Knative Service.
 *
 * @param params - The settings to save.
 * @returns The patch, or null when every setting is left out.
 */
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
          name: null,
          ...(hasAnnotationsPatch ? { annotations: annotationsPatch } : {}),
        },
        ...(hasTemplateSpecPatch ? { spec: templateSpecPatch } : {}),
      },
    },
  };
}
