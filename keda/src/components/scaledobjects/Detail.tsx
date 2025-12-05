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
import { useParams } from 'react-router-dom';
import { ScaledObject, ScalingModifierMetricType } from '../../resources/scaledobject';
import { KedaInstallCheck, TriggersSection } from '../common/CommonComponents';

export function ScaledObjectDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  const [scaledObject] = ScaledObject.useGet(name, namespace);
  const scaleTargetKind = scaledObject?.scaleTargetKind;
  const scaleTargetName = scaledObject?.scaleTargetName;

  const [deploymentTarget] = K8s.ResourceClasses.Deployment.useGet(scaleTargetName, namespace);
  const [statefulSetTarget] = K8s.ResourceClasses.StatefulSet.useGet(scaleTargetName, namespace);

  let scaleTarget: Deployment | StatefulSet | null = null;
  if (scaleTargetKind === K8s.ResourceClasses.Deployment.kind) {
    scaleTarget = deploymentTarget;
  } else if (scaleTargetKind === K8s.ResourceClasses.StatefulSet.kind) {
    scaleTarget = statefulSetTarget;
  }

  return (
    <KedaInstallCheck>
      <DetailsGrid
        resourceType={ScaledObject}
        name={name}
        namespace={namespace}
        withEvents
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
              value: item.spec.scaleTargetRef.envSourceContainerName || (
                <>
                  {(() => {
                    if (!scaleTarget) return '-';

                    const containers = scaleTarget?.spec?.template?.spec?.containers;
                    if (!containers || !(containers.length > 0)) {
                      return '-';
                    }

                    return containers[0].name;
                  })()}
                </>
              ),
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
            ...(scaleTarget
              ? [
                  {
                    id: 'pods',
                    section: <OwnedPodsSection resource={scaleTarget} />,
                  },
                ]
              : []),
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
                                                  .behavior.scaleDown.stabilizationWindowSeconds ??
                                                'Default'
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
              section: <TriggersSection resource={item} />,
            },
            {
              id: 'conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </KedaInstallCheck>
  );
}
