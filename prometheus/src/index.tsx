import './globals';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DetailsViewSectionProps, registerDetailsViewSection } from '@kinvolk/headlamp-plugin/lib';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import React, { useEffect, useState } from 'react';

const request = ApiProxy.request;

export async function isPrometheusInstalled() {
  const queryParams = new URLSearchParams();
  queryParams.append('labelSelector', 'app.kubernetes.io/name=prometheus');

  const response = await request(`/api/v1/pods?${queryParams.toString()}`, {
    method: 'GET',
  });

  if (response.items && response.items.length > 0) {
    return [true, response.items[0].metadata.name, response.items[0].metadata.namespace];
  }
  return [false, null, null];
}

function MetricsEnabled({ children }) {
  const [prometheusInstalled, setPrometheusInstalled] = useState<boolean>(false);
  const [promPodName, setPromPodName] = useState<string>(null);
  const [promNamespace, setPromNamespace] = useState<string>(null);

  useEffect(() => {
    (async () => {
      const [isInstalled, podName, namespace] = await isPrometheusInstalled();
      setPromPodName(podName);
      setPromNamespace(namespace);
      setPrometheusInstalled(isInstalled);
    })();
  }, []);

  return (
    <div>
      {prometheusInstalled ? (
        <>
          {React.cloneElement(children, {
            prometheusPodName: promPodName,
            prometheusNamespace: promNamespace,
          })}
        </>
      ) : (
        <div>prometheus is not installed</div>
      )}
    </div>
  );
}

function PodMetrics(props: {
  podName: string;
  namespace: string;
  prometheusPodName: string;
  prometheusNamespace: string;
}) {
  return (
    <div>
      <div>podName: {props.podName}</div>
      <div>namespace: {props.namespace}</div>
      <div>prometheusPodName: {props.prometheusPodName}</div>
      <div>prometheusNamespace: {props.prometheusNamespace}</div>
    </div>
  );
}

function PrometheusMetrics(resource: DetailsViewSectionProps) {

    if (resource.kind === 'Pod') {
    return (
      <MetricsEnabled>
        <PodMetrics
          podName={resource.jsonData.metadata.name}
          namespace={resource.jsonData.metadata.namespace}
        />
      </MetricsEnabled>
    );
  }
  return <div>not a pod</div>;
}

registerDetailsViewSection(({ resource }: DetailsViewSectionProps) => {
  return PrometheusMetrics(resource);
});
