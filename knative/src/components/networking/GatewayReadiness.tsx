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

import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import type { GatewayConfig } from '../../config/gateway';
import type {
  GatewayReadinessResult,
  ReadinessState,
  ServiceReadinessResult,
} from '../../config/gatewayReadiness';
import { evaluateGatewayReadiness, evaluateServiceReadiness } from '../../config/gatewayReadiness';
import { getErrorMessage, isNotFoundError } from '../../utils/error';
import { ReadyStatusLabel } from '../common/ReadyStatusLabel';

const { Gateway, Service } = ResourceClasses;

const CONDITION_STATUS_BY_READINESS: Record<ReadinessState, 'True' | 'False' | 'Unknown'> = {
  ready: 'True',
  'not-ready': 'False',
  unknown: 'Unknown',
};

function StatusHeading({ label, state }: { label: string; state: ReadinessState }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
      <Typography variant="body2">{label}:</Typography>
      <ReadyStatusLabel status={CONDITION_STATUS_BY_READINESS[state]} />
    </Stack>
  );
}

function ServiceReadinessDetails({ readiness }: { readiness: ServiceReadinessResult }) {
  return (
    <>
      <StatusHeading label={`Service status (${readiness.serviceType})`} state={readiness.state} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {readiness.summary}
      </Typography>
      {readiness.addresses.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Addresses: {readiness.addresses.join(', ')}
        </Typography>
      )}
      {readiness.ports.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Ports: {readiness.ports.join(', ')}
        </Typography>
      )}
    </>
  );
}

export interface GatewayReadinessDetailsProps {
  gatewayReadiness: GatewayReadinessResult;
  serviceReadiness?: ServiceReadinessResult | null;
}

/** Renders the evaluated Gateway and optional Service readiness details. */
export function GatewayReadinessDetails({
  gatewayReadiness,
  serviceReadiness,
}: GatewayReadinessDetailsProps) {
  const condition = gatewayReadiness.condition;
  const conditionText = condition
    ? `${condition.type}=${condition.status}${condition.reason ? ` (${condition.reason})` : ''}${
        condition.message ? `: ${condition.message}` : ''
      }`
    : null;

  return (
    <Box sx={{ mt: 1 }}>
      <StatusHeading label="Gateway status" state={gatewayReadiness.state} />
      {conditionText ? (
        <Alert severity={gatewayReadiness.state === 'not-ready' ? 'error' : 'info'} sx={{ mt: 1 }}>
          {conditionText}
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {gatewayReadiness.summary}
        </Typography>
      )}
      {gatewayReadiness.addresses.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Addresses: {gatewayReadiness.addresses.join(', ')}
        </Typography>
      )}

      {serviceReadiness && <ServiceReadinessDetails readiness={serviceReadiness} />}
    </Box>
  );
}

function ResourceStatusError({
  label,
  resource,
  error,
}: {
  label: string;
  resource: string;
  error: unknown;
}) {
  const isNotFound = isNotFoundError(error);
  const readinessState: ReadinessState = isNotFound ? 'not-ready' : 'unknown';

  return (
    <Box sx={{ mt: 1 }}>
      <StatusHeading label={label} state={readinessState} />
      <Alert severity="error" sx={{ mt: 1 }}>
        {isNotFound
          ? `${resource} was not found.`
          : `Unable to read ${resource}: ${getErrorMessage(error)}`}
      </Alert>
    </Box>
  );
}

function LoadingStatus({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
      <CircularProgress size={16} />
      <Typography variant="body2" color="text.secondary">
        Checking {label} readiness…
      </Typography>
    </Stack>
  );
}

function GatewayServiceReadinessStatus({
  service,
  cluster,
}: {
  service: NonNullable<GatewayConfig['service']>;
  cluster: string;
}) {
  const {
    data: serviceResource,
    error,
    isLoading,
  } = Service.useGet(service.name, service.namespace, { cluster });

  if (isLoading) return <LoadingStatus label="Service" />;
  if (error) {
    return (
      <ResourceStatusError
        label="Service status"
        resource={`Service ${service.namespace}/${service.name}`}
        error={error}
      />
    );
  }
  if (!serviceResource) {
    return (
      <ResourceStatusError
        label="Service status"
        resource={`Service ${service.namespace}/${service.name}`}
        error={{ status: 404 }}
      />
    );
  }

  return <ServiceReadinessDetails readiness={evaluateServiceReadiness(serviceResource.jsonData)} />;
}

export function GatewayReadinessStatus({
  config,
  cluster,
}: {
  config: GatewayConfig;
  cluster: string;
}) {
  const {
    data: gateway,
    error,
    isLoading,
  } = Gateway.useGet(config.gateway.name, config.gateway.namespace, { cluster });

  return (
    <Box sx={{ mt: 1 }}>
      {isLoading ? (
        <LoadingStatus label="Gateway" />
      ) : error ? (
        <ResourceStatusError
          label="Gateway status"
          resource={`Gateway ${config.gateway.namespace}/${config.gateway.name}`}
          error={error}
        />
      ) : gateway ? (
        <GatewayReadinessDetails gatewayReadiness={evaluateGatewayReadiness(gateway.status)} />
      ) : (
        <ResourceStatusError
          label="Gateway status"
          resource={`Gateway ${config.gateway.namespace}/${config.gateway.name}`}
          error={{ status: 404 }}
        />
      )}

      {config.service ? (
        <GatewayServiceReadinessStatus service={config.service} cluster={cluster} />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Service readiness is not evaluated because config-gateway does not specify a Service.
        </Typography>
      )}
    </Box>
  );
}
