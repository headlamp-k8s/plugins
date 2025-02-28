'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { jsx as _jsx } from "react/jsx-runtime";
let warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedSkeleton(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The Skeleton component was moved from the lab to the core.', '', "You should use `import { Skeleton } from '@mui/material'`", "or `import Skeleton from '@mui/material/Skeleton'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(Skeleton, _extends({
    ref: ref
  }, props));
});