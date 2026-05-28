import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
import {
  hasPausedReplicas,
  isPaused,
  PausedReplicasAction,
  PauseScalingAction,
  ResumeScalingAction,
} from '../common/ScalingActions';

export function ScaledObjectDetail(props: { namespace?: string; name?: string }) {
  const { t } = useTranslation();
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
        actions={item =>
          item
            ? [
                ...(!isPaused(item) && !hasPausedReplicas(item)
                  ? [{ id: 'keda.pause-scaling', action: <PauseScalingAction resource={item} /> }]
                  : []),
                ...(!isPaused(item)
                  ? [
                      {
                        id: 'keda.paused-replicas',
                        action: <PausedReplicasAction resource={item} />,
                      },
                    ]
                  : []),
                ...(isPaused(item) || hasPausedReplicas(item)
                  ? [
                      {
                        id: 'keda.resume-scaling',
                        action: <ResumeScalingAction resource={item} />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        extraInfo={item =>
          item && [
            {
              name: t('API Version'),
              value: ScaledObject.apiVersion,
            },
            {
              name: t('Kind'),
              value: 'ScaledObject',
            },
            {
              name: t('Polling Interval'),
              value: `${item.pollingInterval}s`,
            },
            {
              name: t('Cooldown Period'),
              value: `${item.cooldownPeriod}s`,
            },
            {
              name: t('Initial Cooldown Period'),
              value: `${item.initialCooldownPeriod}s`,
            },
            {
              name: t('Scale Target Reference'),
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
              name: t('Env Source Container Name'),
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
              name: t('Idle Replica Count'),
              value: item.idleReplicaCount ?? '-',
            },
            {
              name: t('Minimum Replica Count'),
              value: item.minReplicaCount,
            },
            {
              name: t('Maximum Replica Count'),
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
                <SectionBox title={t('Status')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('External Metric Names'),
                        value:
                          item.status.externalMetricNames &&
                          item.status.externalMetricNames.length > 0
                            ? item.status.externalMetricNames.join(', ')
                            : t('None'),
                      },
                      {
                        name: t('HPA Reference'),
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
                        name: t('Last Active Time'),
                        value: item.status.lastActiveTime ?? t('N/A'),
                      },
                      {
                        name: t('Original Replica Count'),
                        value: item.status.originalReplicaCount ?? t('N/A'),
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'fallback',
              section: item.spec.fallback && (
                <SectionBox title={t('Fallback')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Failure Threshold'),
                        value: item.spec.fallback.failureThreshold,
                      },
                      {
                        name: t('Replicas'),
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
                <SectionBox title={t('Advanced Configuration')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Restore To Original Replica Count'),
                        value: item.spec.advanced.restoreToOriginalReplicaCount
                          ? t('Yes')
                          : t('No'),
                      },
                      {
                        name: t('HPA Config'),
                        value: item.spec.advanced.horizontalPodAutoscalerConfig && (
                          <NameValueTable
                            rows={[
                              {
                                name: t('Name'),
                                value:
                                  item.spec.advanced.horizontalPodAutoscalerConfig.name ||
                                  `keda-hpa-${item.metadata.name}`,
                              },
                              {
                                name: t('Behavior'),
                                value: item.spec.advanced.horizontalPodAutoscalerConfig
                                  .behavior && (
                                  <>
                                    {item.spec.advanced.horizontalPodAutoscalerConfig.behavior
                                      .scaleDown && (
                                      <>
                                        <h4>{t('Scale Down')}</h4>
                                        <NameValueTable
                                          rows={[
                                            {
                                              name: t('Stabilization Window'),
                                              value: `${
                                                item.spec.advanced.horizontalPodAutoscalerConfig
                                                  .behavior.scaleDown.stabilizationWindowSeconds ??
                                                t('Default')
                                              }s`,
                                            },
                                            {
                                              name: t('Policies'),
                                              value: item.spec.advanced
                                                .horizontalPodAutoscalerConfig.behavior.scaleDown
                                                .policies ? (
                                                <>
                                                  {item.spec.advanced.horizontalPodAutoscalerConfig.behavior.scaleDown.policies?.map(
                                                    (policy, i) => (
                                                      <NameValueTable
                                                        key={i}
                                                        rows={[
                                                          { name: t('Type'), value: policy.type },
                                                          {
                                                            name: t('Value'),
                                                            value: `${policy.value}%`,
                                                          },
                                                          {
                                                            name: t('Period'),
                                                            value: `${policy.periodSeconds}s`,
                                                          },
                                                        ]}
                                                      />
                                                    )
                                                  )}
                                                </>
                                              ) : (
                                                t('None')
                                              ),
                                            },
                                          ]}
                                        />
                                      </>
                                    )}
                                    {item.spec.advanced.horizontalPodAutoscalerConfig.behavior
                                      .scaleUp && (
                                      <>
                                        <h4>{t('Scale Up')}</h4>
                                        <NameValueTable
                                          rows={[
                                            {
                                              name: t('Stabilization Window'),
                                              value: `${
                                                item.spec.advanced.horizontalPodAutoscalerConfig
                                                  .behavior.scaleUp.stabilizationWindowSeconds ??
                                                t('Default')
                                              }s`,
                                            },
                                            {
                                              name: t('Policies'),
                                              value: item.spec.advanced
                                                .horizontalPodAutoscalerConfig.behavior.scaleUp
                                                .policies ? (
                                                <>
                                                  {item.spec.advanced.horizontalPodAutoscalerConfig.behavior.scaleUp.policies?.map(
                                                    (policy, i) => (
                                                      <NameValueTable
                                                        key={i}
                                                        rows={[
                                                          { name: t('Type'), value: policy.type },
                                                          {
                                                            name: t('Value'),
                                                            value: `${policy.value}%`,
                                                          },
                                                          {
                                                            name: t('Period'),
                                                            value: `${policy.periodSeconds}s`,
                                                          },
                                                        ]}
                                                      />
                                                    )
                                                  )}
                                                </>
                                              ) : (
                                                t('None')
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
                              name: t('Scaling Modifiers'),
                              value: (
                                <NameValueTable
                                  rows={[
                                    {
                                      name: t('Target'),
                                      value: item.spec.advanced.scalingModifiers.target,
                                    },
                                    {
                                      name: t('Activation Target'),
                                      value:
                                        item.spec.advanced.scalingModifiers.activationTarget ?? 0,
                                    },
                                    {
                                      name: t('Metric Type'),
                                      value:
                                        item.spec.advanced.scalingModifiers.metricType ||
                                        ScalingModifierMetricType.AVERAGEVALUE,
                                    },
                                    {
                                      name: t('Formula'),
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
