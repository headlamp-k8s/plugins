'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import { jsx as _jsx } from "react/jsx-runtime";
var warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedToggleButton(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The ToggleButton component was moved from the lab to the core.', '', "You should use `import { ToggleButton } from '@mui/material'`", "or `import ToggleButton from '@mui/material/ToggleButton'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(ToggleButton, _extends({
    ref: ref
  }, props));
});