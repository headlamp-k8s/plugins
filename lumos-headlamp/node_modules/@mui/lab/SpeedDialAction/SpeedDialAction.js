'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { jsx as _jsx } from "react/jsx-runtime";
let warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedSpeedDialAction(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The SpeedDialAction component was moved from the lab to the core.', '', "You should use `import { SpeedDialAction } from '@mui/material'`", "or `import SpeedDialAction from '@mui/material/SpeedDialAction'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(SpeedDialAction, _extends({
    ref: ref
  }, props));
});