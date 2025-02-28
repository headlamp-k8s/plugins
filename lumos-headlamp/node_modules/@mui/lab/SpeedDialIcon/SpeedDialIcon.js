'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { jsx as _jsx } from "react/jsx-runtime";
let warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedSpeedDialIcon(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The SpeedDialIcon component was moved from the lab to the core.', '', "You should use `import { SpeedDialIcon } from '@mui/material'`", "or `import SpeedDialIcon from '@mui/material/SpeedDialIcon'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(SpeedDialIcon, _extends({
    ref: ref
  }, props));
});