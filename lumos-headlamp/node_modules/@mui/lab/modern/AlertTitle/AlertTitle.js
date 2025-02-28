'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import AlertTitle from '@mui/material/AlertTitle';
import { jsx as _jsx } from "react/jsx-runtime";
let warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedAlertTitle(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The AlertTitle component was moved from the lab to the core.', '', "You should use `import { AlertTitle } from '@mui/material'`", "or `import AlertTitle from '@mui/material/AlertTitle'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(AlertTitle, _extends({
    ref: ref
  }, props));
});