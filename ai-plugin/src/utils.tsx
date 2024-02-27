import React from 'react';
import { useBetween } from 'use-between';

function usePluginSettings() {
  const [event, setEvent] = React.useState(null);

  return {
    event,
    setEvent,
  };
}

export const useGlobalState = () => useBetween(usePluginSettings);
