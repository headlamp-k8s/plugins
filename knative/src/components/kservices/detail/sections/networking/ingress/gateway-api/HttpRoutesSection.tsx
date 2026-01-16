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
  ResourceTable,
  type ResourceTableColumn,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Chip, Stack, Typography } from '@mui/material';

const { HTTPRoute } = ResourceClasses;
type HttpRoute = InstanceType<typeof HTTPRoute>;

type HttpRoutesSectionProps = {
  title: string;
  namespace: string;
  routes: HttpRoute[] | null;
  serviceName?: string;
  networkTemplates: { domainTemplate: string; tagTemplate: string } | null;
};

function escapeRegex(input: string): string {
  return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function buildNamePatternFromTagTemplate(tagTemplate: string, serviceName: string): string {
  // Escape regex special chars outside tokens
  let pattern = escapeRegex(tagTemplate);
  // Unescape token braces to process replacements
  pattern = pattern
    .replace(/\\{{2}\.Tag\\}{2}/g, '(?<tag>[a-z0-9-]+)')
    .replace(/\\{{2}\.Name\\}{2}/g, escapeRegex(serviceName));
  // Any other templated variables -> permissive
  pattern = pattern.replace(/\\{{2}[^}]+\\}{2}/g, '.*?');
  return pattern;
}

function buildRouteNameRegexFromDomainTemplate(opts: {
  domainTemplate: string;
  namePattern: string;
  namespace: string;
}): RegExp {
  const { domainTemplate, namePattern, namespace } = opts;
  let pattern = escapeRegex(domainTemplate);
  pattern = pattern
    // NOTE: namePattern is already a regex pattern (may include capture groups).
    .replace(/\\{{2}\.Name\\}{2}/g, namePattern)
    .replace(/\\{{2}\.Namespace\\}{2}/g, escapeRegex(namespace))
    .replace(/\\{{2}\.Domain\\}{2}/g, '.+');
  // Any other templated variables -> permissive
  pattern = pattern.replace(/\\{{2}[^}]+\\}{2}/g, '.*?');
  return new RegExp(`^${pattern}$`);
}

function getTagFromRouteName(opts: {
  routeName: string;
  serviceName: string | undefined;
  serviceNamespace: string;
  templates: { domainTemplate: string; tagTemplate: string } | null;
}): string | null {
  const { routeName, serviceName, serviceNamespace, templates } = opts;
  if (!serviceName || !templates) return null;
  const namePattern = buildNamePatternFromTagTemplate(templates.tagTemplate, serviceName);
  const re = buildRouteNameRegexFromDomainTemplate({
    domainTemplate: templates.domainTemplate,
    namePattern,
    namespace: serviceNamespace,
  });
  const match = routeName.match(re);
  const tag = match?.groups?.tag?.trim();
  return tag ? tag : null;
}

function parseRolloutAnnotationTags(raw: string | undefined): {
  tags: string[];
  invalidJson: boolean;
} {
  if (!raw) return { tags: [], invalidJson: false };
  const text = raw.trim();
  if (!text) return { tags: [], invalidJson: false };

  try {
    const parsed: unknown = JSON.parse(text);
    const tags: string[] = [];

    if (
      parsed &&
      typeof parsed === 'object' &&
      'configurations' in parsed &&
      Array.isArray((parsed as { configurations?: unknown }).configurations)
    ) {
      for (const c of (parsed as { configurations: Array<Record<string, unknown>> })
        .configurations) {
        const tag = typeof c.tag === 'string' ? c.tag.trim() : '';
        if (!tag) continue;
        if (!tags.includes(tag)) tags.push(tag);
      }
    }

    return { tags, invalidJson: false };
  } catch {
    return { tags: [], invalidJson: true };
  }
}

function uniqNonEmpty(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const v of values) {
    const s = (v ?? '').trim();
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function getOriginLabels(r: HttpRoute, serviceName: string | undefined): string[] {
  const labels = r.metadata.labels ?? {};
  const origins: string[] = [];

  if (
    labels['serving.knative.dev/domainMappingNamespace'] ||
    labels['serving.knative.dev/domainMappingUID']
  ) {
    // Prefer a single clear origin label. DomainMapping-derived routes can still also have
    // other Knative labels, so treat this as authoritative.
    return ['DomainMapping'];
  }

  // Keep origin simple and actionable in UI.
  // Many HTTPRoutes end up with route/rollout-related metadata, so we don't show those as origin.
  if (
    serviceName &&
    (labels['serving.knative.dev/service'] === serviceName ||
      labels['serving.knative.dev/route'] === serviceName ||
      r.metadata.name === serviceName)
  ) {
    return ['KService'];
  }

  return origins;
}

function getRoleInfo(opts: {
  r: HttpRoute;
  serviceName: string | undefined;
  serviceNamespace: string;
  templates: { domainTemplate: string; tagTemplate: string } | null;
}): { isMain: boolean; tags: string[]; rolloutInvalidJson: boolean } {
  const { r, serviceName, serviceNamespace, templates } = opts;
  const routeName = r.metadata.name ?? '';

  const isMain = (() => {
    if (!serviceName) return false;
    if (routeName === serviceName) return true;
    if (templates) {
      const namePattern = escapeRegex(serviceName);
      const re = buildRouteNameRegexFromDomainTemplate({
        domainTemplate: templates.domainTemplate,
        namePattern,
        namespace: serviceNamespace,
      });
      if (re.test(routeName)) return true;
    }
    // Fallback: common FQDN-ish prefix
    return routeName.startsWith(`${serviceName}.${serviceNamespace}.`);
  })();

  const rollout = parseRolloutAnnotationTags(
    r.metadata.annotations?.['networking.internal.knative.dev/rollout']
  );
  const tagFromName = getTagFromRouteName({
    routeName,
    serviceName,
    serviceNamespace,
    templates,
  });

  const tags = uniqNonEmpty([tagFromName, ...rollout.tags]);
  return { isMain, tags, rolloutInvalidJson: rollout.invalidJson };
}

function slugifyForId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function HttpRoutesSection({
  title,
  namespace,
  routes,
  serviceName,
  networkTemplates,
}: HttpRoutesSectionProps) {
  const uniqueClusters = new Set(
    (routes ?? []).map(r => r.cluster).filter((c): c is string => Boolean(c))
  );
  const showClusterColumn = uniqueClusters.size > 1;

  const columns: (ResourceTableColumn<KubeObject> | 'cluster' | 'age' | 'name')[] = [
    ...(showClusterColumn ? (['cluster'] as const) : []),
    'name',
    {
      id: 'role',
      label: 'Role',
      gridTemplate: 'min-content',
      getValue: item => {
        const r = item as HttpRoute;
        const { isMain, tags, rolloutInvalidJson } = getRoleInfo({
          r,
          serviceName,
          serviceNamespace: namespace,
          templates: networkTemplates
            ? {
                domainTemplate: networkTemplates.domainTemplate,
                tagTemplate: networkTemplates.tagTemplate,
              }
            : null,
        });
        const parts: string[] = [];
        if (isMain) parts.push('main');
        for (const t of tags) parts.push(`tag:${t}`);
        if (rolloutInvalidJson) parts.push('rollout:invalid');
        return parts.join(', ');
      },
      render: item => {
        const r = item as HttpRoute;
        const { isMain, tags, rolloutInvalidJson } = getRoleInfo({
          r,
          serviceName,
          serviceNamespace: namespace,
          templates: networkTemplates
            ? {
                domainTemplate: networkTemplates.domainTemplate,
                tagTemplate: networkTemplates.tagTemplate,
              }
            : null,
        });

        if (!isMain && tags.length === 0 && !rolloutInvalidJson) {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {isMain && <Chip label="main" size="small" color="primary" />}
            {tags.map(t => (
              <Chip key={t} label={`tag: ${t}`} size="small" color="default" />
            ))}
            {rolloutInvalidJson && <Chip label="rollout: invalid" size="small" color="warning" />}
          </Stack>
        );
      },
    },
    {
      id: 'origin',
      label: 'Origin',
      gridTemplate: 'min-content',
      getValue: item => {
        const r = item as HttpRoute;
        return getOriginLabels(r, serviceName).join(', ');
      },
      render: item => {
        const r = item as HttpRoute;
        const origins = getOriginLabels(r, serviceName);
        if (origins.length === 0) {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {origins.map(o => (
              <Chip
                key={o}
                label={o}
                size="small"
                color={o === 'DomainMapping' ? 'info' : 'default'}
              />
            ))}
          </Stack>
        );
      },
    },
    {
      id: 'hostnames',
      label: 'Hostnames',
      getValue: item => {
        const r = item as HttpRoute;
        return (r.spec?.hostnames ?? []).join(', ') || '';
      },
      render: item => {
        const r = item as HttpRoute;
        const hostnames = (r.spec?.hostnames ?? []).join(', ');
        return hostnames ? (
          <Typography variant="caption" color="text.secondary">
            {hostnames}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        );
      },
    },
    'age',
  ];

  return (
    <SectionBox title={title}>
      <ResourceTable.default<typeof HTTPRoute>
        id={`knative-kservice-httproutes-${slugifyForId(title)}`}
        columns={columns}
        data={routes}
        enableRowActions={false}
        enableRowSelection={false}
        reflectInURL={false}
      />
    </SectionBox>
  );
}
