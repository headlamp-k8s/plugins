'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import { jsx as _jsx } from "react/jsx-runtime";
var warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedSpeedDial(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The SpeedDial component was moved from the lab to the core.', '', "You should use `import { SpeedDial } from '@mui/material'`", "or `import SpeedDial from '@mui/material/SpeedDial'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(SpeedDial, _extends({
    ref: ref
  }, props));
});