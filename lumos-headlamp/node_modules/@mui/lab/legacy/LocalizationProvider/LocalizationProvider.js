'use client';

import * as React from 'react';
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The LocalizationProvider component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { LocalizationProvider } from '@mui/x-date-pickers'`", "or `import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The LocalizationProvider component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var LocalizationProvider = /*#__PURE__*/React.forwardRef(function DeprecatedLocalizationProvider() {
  warn();
  return null;
});
export default LocalizationProvider;