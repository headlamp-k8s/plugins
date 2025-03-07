import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  Link,
  NameValueTable,
  OwnedPodsSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Deployment from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import StatefulSet from '@kinvolk/headlamp-plugin/lib/k8s/statefulSet';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import {
  ScaledObject,
  ScalingModifierMetricType,
  TriggerMetricType,
} from '../../resources/scaledobject';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ScaledObjectDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();
  const [deployments] = K8s.ResourceClasses.Deployment.useList() as [Deployment[]];
  const [statefulSets] = K8s.ResourceClasses.StatefulSet.useList() as [StatefulSet[]];

  const getScaleTarget = useMemo(() => {
    return (scaledObject: ScaledObject) => {
      const kind = scaledObject.scaleTargetKind;
      const targetName = scaledObject.scaleTargetName;
      if (!targetName) return null;
      const targetNamespace = scaledObject.metadata.namespace;

      type K8sScaleResources = Deployment | StatefulSet;

      const scaleResources: Record<string, K8sScaleResources[]> = {
        [K8s.ResourceClasses.Deployment.kind]: deployments || [],
        [K8s.ResourceClasses.StatefulSet.kind]: statefulSets || [],
      };

      const scaleResource = scaleResources[kind];
      if (!scaleResource) return null;

      return (
        scaleResource.find(
          resource =>
            resource.metadata.name === targetName && resource.metadata.namespace === targetNamespace
        ) || null
      );
    };
  }, [deployments, statefulSets]);

  const getDefaultEnvSourceContainerName = (item: ScaledObject) => {
    if (!item) return '-';

    const scaleTarget = getScaleTarget(item);
    if (!scaleTarget) return '-';

    const containers = scaleTarget?.spec?.template?.spec?.containers;
    if (!containers || !(containers.length > 0)) {
      return '-';
    }

    return containers[0].name;
  };

  return (
    <>
      {isKedaInstalled ? (
        <DetailsGrid
          resourceType={ScaledObject}
          name={name}
          withEvents
          namespace={namespace}
          extraInfo={item =>
            item && [
              {
                name: 'API Version',
                value: ScaledObject.apiVersion,
              },
              {
                name: 'Kind',
                value: 'ScaledObject',
              },
              {
                name: 'Polling Interval',
                value: `${item.pollingInterval}s`,
              },
              {
                name: 'Cooldown Period',
                value: `${item.cooldownPeriod}s`,
              },
              {
                name: 'Initial Cooldown Period',
                value: `${item.initialCooldownPeriod}s`,
              },
              {
                name: 'Scale Target Reference',
                value: (
                  <Link
                    routeName={item.scaleTargetKind}
                    params={{
                      name: item.scaleTargetName,
                      namespace: item.metadata.namespace,
                    }}
                  >
                    {item.scaleTargetKind}/{item.scaleTargetName}
                  </Link>
                ),
              },
              {
                name: 'Env Source Container Name',
                value:
                  item.spec.scaleTargetRef.envSourceContainerName ||
                  getDefaultEnvSourceContainerName(item),
              },
              {
                name: 'Idle Replica Count',
                value: item.idleReplicaCount ?? '-',
              },
              {
                name: 'Minimum Replica Count',
                value: item.minReplicaCount,
              },
              {
                name: 'Maximum Replica Count',
                value: item.maxReplicaCount,
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'conditions',
                section: <ConditionsSection resource={item?.jsonData} />,
              },
              {
                id: 'pods',
                section: (
                  <>
                    {(() => {
                      const scaleTarget = getScaleTarget(item);
                      return scaleTarget ? (
                        <OwnedPodsSection resource={scaleTarget?.jsonData} />
                      ) : null;
                    })()}
                  </>
                ),
              },
              {
                id: 'status',
                section: item.status && (
                  <SectionBox title="Status">
                    <NameValueTable
                      rows={[
                        {
                          name: 'External Metric Names',
                          value:
                            item.status.externalMetricNames &&
                            item.status.externalMetricNames.length > 0
                              ? item.status.externalMetricNames.join(', ')
                              : 'None',
                        },
                        {
                          name: 'HPA Reference',
                          value: (
                            <Link
                              routeName="horizontalPodAutoscaler"
                              params={{
                                name: item.status.hpaName,
                                namespace: item.metadata.namespace,
                              }}
                            >
                              HorizontalPodAutoscaler/{item.status.hpaName}
                            </Link>
                          ),
                        },
                        {
                          name: 'Last Active Time',
                          value: item.status.lastActiveTime ?? 'N/A',
                        },
                        {
                          name: 'Original Replica Count',
                          value: item.status.originalReplicaCount ?? 'N/A',
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'fallback',
                section: item.spec.fallback && (
                  <SectionBox title="Fallback">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Failure Threshold',
                          value: item.spec.fallback.failureThreshold,
                        },
                        {
                          name: 'Replicas',
                          value: item.spec.fallback.replicas,
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'advanced',
                section: item.spec.advanced && (
                  <SectionBox title="Advanced Configuration">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Restore To Original Replica Count',
                          value: item.spec.advanced.restoreToOriginalReplicaCount ? 'Yes' : 'No',
                        },
                        {
                          name: 'HPA Config',
                          value: item.spec.advanced.horizontalPodAutoscalerConfig && (
                            <NameValueTable
                              rows={[
                                {
                                  name: 'Name',
                                  value:
                                    item.spec.advanced.horizontalPodAutoscalerConfig.name ||
                                    `keda-hpa-${item.metadata.name}`,
                                },
                                {
                                  name: 'Behavior',
                                  value: item.spec.advanced.horizontalPodAutoscalerConfig
                                    .behavior && (
                                    <>
                                      {item.spec.advanced.horizontalPodAutoscalerConfig.behavior
                                        .scaleDown && (
                                        <>
                                          <h4>Scale Down</h4>
                                          <NameValueTable
                                            rows={[
                                              {
                                                name: 'Stabilization Window',
                                                value: `${
                                                  item.spec.advanced.horizontalPodAutoscalerConfig
                                                    .behavior.scaleDown
                                                    .stabilizationWindowSeconds ?? 'Default'
                                                }s`,
                                              },
                                              {
                                                name: 'Policies',
                                                value: item.spec.advanced
                                                  .horizontalPodAutoscalerConfig.behavior.scaleDown
                                                  .policies ? (
                                                  <>
                                                    {item.spec.advanced.horizontalPodAutoscalerConfig.behavior.scaleDown.policies?.map(
                                                      (policy, i) => (
                                                        <NameValueTable
                                                          key={i}
                                                          rows={[
                                                            { name: 'Type', value: policy.type },
                                                            {
                                                              name: 'Value',
                                                              value: `${policy.value}%`,
                                                            },
                                                            {
                                                              name: 'Period',
                                                              value: `${policy.periodSeconds}s`,
                                                            },
                                                          ]}
                                                        />
                                                      )
                                                    )}
                                                  </>
                                                ) : (
                                                  'None'
                                                ),
                                              },
                                            ]}
                                          />
                                        </>
                                      )}
                                      {item.spec.advanced.horizontalPodAutoscalerConfig.behavior
                                        .scaleUp && (
                                        <>
                                          <h4>Scale Up</h4>
                                          <NameValueTable
                                            rows={[
                                              {
                                                name: 'Stabilization Window',
                                                value: `${
                                                  item.spec.advanced.horizontalPodAutoscalerConfig
                                                    .behavior.scaleUp.stabilizationWindowSeconds ??
                                                  'Default'
                                                }s`,
                                              },
                                              {
                                                name: 'Policies',
                                                value: item.spec.advanced
                                                  .horizontalPodAutoscalerConfig.behavior.scaleUp
                                                  .policies ? (
                                                  <>
                                                    {item.spec.advanced.horizontalPodAutoscalerConfig.behavior.scaleUp.policies?.map(
                                                      (policy, i) => (
                                                        <NameValueTable
                                                          key={i}
                                                          rows={[
                                                            { name: 'Type', value: policy.type },
                                                            {
                                                              name: 'Value',
                                                              value: `${policy.value}%`,
                                                            },
                                                            {
                                                              name: 'Period',
                                                              value: `${policy.periodSeconds}s`,
                                                            },
                                                          ]}
                                                        />
                                                      )
                                                    )}
                                                  </>
                                                ) : (
                                                  'None'
                                                ),
                                              },
                                            ]}
                                          />
                                        </>
                                      )}
                                    </>
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                        ...(Object.keys(item.spec.advanced.scalingModifiers).length > 0
                          ? [
                              {
                                name: 'Scaling Modifiers',
                                value: (
                                  <NameValueTable
                                    rows={[
                                      {
                                        name: 'Target',
                                        value: item.spec.advanced.scalingModifiers.target,
                                      },
                                      {
                                        name: 'Activation Target',
                                        value:
                                          item.spec.advanced.scalingModifiers.activationTarget ?? 0,
                                      },
                                      {
                                        name: 'Metric Type',
                                        value:
                                          item.spec.advanced.scalingModifiers.metricType ||
                                          ScalingModifierMetricType.AVERAGEVALUE,
                                      },
                                      {
                                        name: 'Formula',
                                        value: (
                                          <pre className="bg-gray-100 p-2 rounded">
                                            {item.spec.advanced.scalingModifiers.formula}
                                          </pre>
                                        ),
                                      },
                                    ]}
                                  />
                                ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'triggers',
                section: (
                  <SectionBox title="Triggers">
                    {item.spec.triggers.map((trigger, index) => (
                      <div key={index}>
                        <h2>{`Trigger ${index + 1} (${trigger.type})`}</h2>
                        <NameValueTable
                          rows={[
                            {
                              name: 'Type',
                              value: trigger.type,
                            },
                            {
                              name: 'Metadata',
                              value: (
                                <NameValueTable
                                  rows={Object.entries(trigger.metadata).map(([key, value]) => ({
                                    name: key,
                                    value: value,
                                  }))}
                                />
                              ),
                            },
                            {
                              name: 'Name',
                              value: trigger.name || '-',
                            },
                            {
                              name: 'Use Cached Metrics',
                              value: trigger.useCachedMetrics ? 'Yes' : 'No',
                            },
                            {
                              name: 'Authentication Reference',
                              value: trigger.authenticationRef ? (
                                <Link
                                  routeName={
                                    trigger.authenticationRef.kind || TriggerAuthentication.kind
                                  }
                                  params={{
                                    name: trigger.authenticationRef.name,
                                    namespace: item.metadata.namespace,
                                  }}
                                >
                                  {trigger.authenticationRef.kind || TriggerAuthentication.kind}/
                                  {trigger.authenticationRef.name}
                                </Link>
                              ) : (
                                'None'
                              ),
                            },
                            {
                              name: 'Metric Type',
                              value: trigger.metricType ?? TriggerMetricType.AVERAGEVALUE,
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </SectionBox>
                ),
              },
            ]
          }
        />
      ) : (
        <NotInstalledBanner isLoading={isKedaCheckLoading} />
      )}
    </>
  );
}
