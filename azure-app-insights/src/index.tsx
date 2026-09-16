import {
  DefaultHeadlampEvents,
  registerAppBarAction,
  HeadlampEvent,
  registerHeadlampEventCallback,
  Headlamp,
} from '@kinvolk/headlamp-plugin/lib';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';
import { ReactPlugin, useTrackMetric } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { createBrowserHistory } from 'history';
import { config } from './config';
import React from 'react';
import { UserConsentDialog, useCompliance, useConsentSnackbar } from './compliance';

const browserHistory = createBrowserHistory({ basename: '' });
var reactPlugin = new ReactPlugin();

function initTracking() {
  const connectionString = config.connectionString;
  if (!connectionString) {
    console.log('No connection string set, skipping AppInsights init');
    return false;
  }

  const clickPluginInstance = new ClickAnalyticsPlugin();
  const clickPluginConfig = {
    autoCapture: true,
  };

  let appInsights = new ApplicationInsights({
    config: {
      connectionString,
      extensions: [reactPlugin, clickPluginInstance],
      enableAutoRouteTracking: true,
      extensionConfig: {
        [reactPlugin.identifier]: { history: browserHistory },
        [clickPluginInstance.identifier]: clickPluginConfig,
      },
      disableCookiesUsage: true,
      disableFetchTracking: true,
    },
  });

  appInsights.loadAppInsights();

  appInsights.addTelemetryInitializer(envelope => {
    const telemetryItem = envelope.data.baseData;
    telemetryItem.properties = telemetryItem.properties || {};
    telemetryItem.properties.headlampInfo = {
      name: Headlamp.getProductName(),
      version: Headlamp.getVersion(),
      isDesktop: Headlamp.isRunningAsApp(),
      isTest: process.env.NODE_ENV === 'test',
    };
  });

  return true;
}

const eventsToIgnore = [DefaultHeadlampEvents.OBJECT_EVENTS];

function trackEvent(event: HeadlampEvent) {
  if (eventsToIgnore.includes(event.type)) {
    return;
  }

  if (event.type === DefaultHeadlampEvents.ERROR_BOUNDARY) {
    reactPlugin.trackException({
      exception: event.data.error,
    });
    return;
  }

  let resource = event.data?.resource || null;

  let resourceKind = resource?.kind || event.data?.resourceKind || null;
  let items = event.data?.resources;
  let numItems = -1;

  if (Array.isArray(items)) {
    numItems = items.length;
  }

  // We do not track the actual details of the resource, just its kind.
  const eventProps: {
    resourceKind?: string;
    numItems?: number;
  } = {};
  if (!!resourceKind) {
    eventProps.resourceKind = resourceKind;
  }
  if (numItems >= 0) {
    eventProps.numItems = numItems;
  }

  reactPlugin.trackEvent(
    {
      name: event.type,
    },
    eventProps
  );
}

function AppInsights() {
  const trackComponent = useTrackMetric(reactPlugin, 'AppInsights');
  const { hasConsent } = useCompliance();
  const showConsentSnackbar = useConsentSnackbar();

  React.useEffect(() => {
    // If we don't know the consent status yet, show the consent dialog. But do not track anything yet!
    if (hasConsent === null) {
      showConsentSnackbar();
      return;
    }

    // No consent means we don't track anything.
    if (!hasConsent) {
      return;
    }

    if (!initTracking()) {
      return;
    }

    trackComponent();
    registerHeadlampEventCallback(event => {
      trackEvent(event);
    });
  }, [hasConsent]);

  return <UserConsentDialog />;
}

registerAppBarAction(<AppInsights />);
