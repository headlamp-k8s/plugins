'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import Alert from '@mui/material/Alert';
import { jsx as _jsx } from "react/jsx-runtime";
var warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedAlert(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The Alert component was moved from the lab to the core.', '', "You should use `import { Alert } from '@mui/material'`", "or `import Alert from '@mui/material/Alert'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(Alert, _extends({
    ref: ref
  }, props));
});