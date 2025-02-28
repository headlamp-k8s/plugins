"use client";

// src/ReactQueryDevtoolsPanel.tsx
import * as React from "react";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { TanstackQueryDevtoolsPanel } from "@tanstack/query-devtools";
import { jsx } from "react/jsx-runtime";
function ReactQueryDevtoolsPanel(props) {
  const queryClient = useQueryClient(props.client);
  const ref = React.useRef(null);
  const { errorTypes, styleNonce, shadowDOMTarget } = props;
  const [devtools] = React.useState(
    new TanstackQueryDevtoolsPanel({
      client: queryClient,
      queryFlavor: "React Query",
      version: "5",
      onlineManager,
      buttonPosition: "bottom-left",
      position: "bottom",
      initialIsOpen: true,
      errorTypes,
      styleNonce,
      shadowDOMTarget,
      onClose: props.onClose
    })
  );
  React.useEffect(() => {
    devtools.setClient(queryClient);
  }, [queryClient, devtools]);
  React.useEffect(() => {
    devtools.setOnClose(props.onClose ?? (() => {
    }));
  }, [props.onClose, devtools]);
  React.useEffect(() => {
    devtools.setErrorTypes(errorTypes || []);
  }, [errorTypes, devtools]);
  React.useEffect(() => {
    if (ref.current) {
      devtools.mount(ref.current);
    }
    return () => {
      devtools.unmount();
    };
  }, [devtools]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: { height: "500px", ...props.style },
      className: "tsqd-parent-container",
      ref
    }
  );
}
export {
  ReactQueryDevtoolsPanel
};
//# sourceMappingURL=ReactQueryDevtoolsPanel.js.map