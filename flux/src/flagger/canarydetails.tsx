import React from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useParams } from 'react-router-dom';
import { ConditionsTable, Link, MainInfoSection, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import CanaryStatus from './canarystatus';
import { ObjectEvents } from '../helpers';
import Event, { KubeEvent } from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { SuspendAction, ResumeAction, RollbackCanary } from '../actions';
import FlaggerAvailabilityCheck from './availabilitycheck';

export default function CanaryDetails() {
    const [canary] = K8s.ResourceClasses.CustomResourceDefinition.useGet('canaries.flagger.app');
  
    return (
        <FlaggerAvailabilityCheck>
         { canary && <CanaryDetailsRenderer resource={canary}/> }
        </FlaggerAvailabilityCheck>
    );
}

function CanaryDetailsRenderer({ resource }) {
    const { namespace, name } = useParams<{namespace, name}>();
    const [cr, setCr] = React.useState(null);
    
    const resourceClass = React.useMemo(() => {
        return resource.makeCRClass();
      }, [resource]);
    
    resourceClass.useApiGet(setCr, name, namespace);
    
    const [events] = Event?.default.useList({
        namespace,
        fieldSelector: `involvedObject.name=${name},involvedObject.kind=${'Canary'}`,
      });
    function prepareExtraInfo(cr) {
        return [{
            name: 'Status',
            value: <CanaryStatus status={cr?.jsonData.status ? cr?.jsonData['status.phase'] : 'Unknown'} />
        },
            {
                name: 'Service',
                value: cr?.jsonData.spec.service?.name || '',
            },
            {
                name: 'Target',
                value: `${cr?.jsonData.spec.targetRef.kind}, ${cr?.jsonData.spec.targetRef.name}, ${cr?.jsonData.spec.targetRef.apiVersion}`,
            },
            {
                name: 'Analysis',
                value: <AnalysisSection analysis={cr?.jsonData.spec.analysis} />,
            },
            {
                name: 'Metrics',
                value: <MetricsSection metrics={cr?.jsonData.spec.analysis.metrics} />,
            },
            {
                name: 'Webhooks',
                value: <WebhooksSection webhooks={cr?.jsonData.spec.analysis.webhooks} />,
            }
        ];
    }
    
    function prepareActions(cr) {
        let actions = [];
        actions.push(<SuspendAction resource={cr} />);
        actions.push(<ResumeAction resource={cr} />);
        actions.push(<RollbackCanary resource={cr} />);
        return actions;
    }

    return cr && <>
    <MainInfoSection   resource={cr}
    extraInfo={prepareExtraInfo(cr)}
    actions={prepareActions(cr)}/>
    <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
    </SectionBox>
    <ObjectEvents events={events?.map((event: KubeEvent) => new Event.default(event))} />
    </>
}

function MetricsSection({ metrics }) {
    if(!metrics) {
        return null;
    }
    return (
      <div>
        {metrics.map((metric, index) => (
          <div key={index}>
            <h4>{metric.name}</h4>
            <p>Interval: {metric.interval}</p>
            {metric.thresholdRange && (
              <p>
                Threshold Range: Min {metric.thresholdRange.min}, Max {metric.thresholdRange.max}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

function AnalysisSection({ analysis }) {
    return (
      <div>
        <p>Interval: {analysis.interval}</p>
        <p>Threshold: {analysis.threshold}</p>
        <p>Max Weight: {analysis.maxWeight}</p>
        {analysis.stepWeight && <p>Step Weight: {analysis.stepWeight}</p>}
        {analysis.stepWeights && (
          <div>
            <p>Step Weights:</p>
            <ul>
              {analysis.stepWeights.map((weight, index) => (
                <li key={index}>{weight}</li>
              ))}
            </ul>
          </div>
        )}
        {analysis.mirror && <p>Mirror: Yes</p>}
        {analysis.iterations && <p>Iterations: {analysis.iterations}</p>}
      </div>
    );
  }


  function WebhooksSection({ webhooks }) {
    return (
      <div>
        {webhooks.map((webhook, index) => (
          <div key={index}>
            <h4>{webhook.name}</h4>
            <p>Type: {webhook.type}</p>
            <p>URL: {webhook.url}</p>
            <pre>{JSON.stringify(webhook.metadata, null, 2)}</pre>
            {webhook.timeout && <p>Timeout: {webhook.timeout}</p>}
          </div>
        ))}
      </div>
    );
  }