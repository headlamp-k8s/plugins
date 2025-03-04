'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { jsx as _jsx } from "react/jsx-runtime";
var warnedOnce = false;

/**
 * @ignore - do not document.
 */
export default /*#__PURE__*/React.forwardRef(function DeprecatedAutocomplete(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The Autocomplete component was moved from the lab to the core.', '', "You should use `import { Autocomplete } from '@mui/material'`", "or `import Autocomplete from '@mui/material/Autocomplete'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/_jsx(Autocomplete, _extends({
    ref: ref
  }, props));
});