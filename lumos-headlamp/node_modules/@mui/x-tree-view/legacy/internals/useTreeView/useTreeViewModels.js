import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _extends from "@babel/runtime/helpers/esm/extends";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import * as React from 'react';
/**
 * Implements the same behavior as `useControlled` but for several models.
 * The controlled models are never stored in the state and the state is only updated if the model is not controlled.
 */
export var useTreeViewModels = function useTreeViewModels(plugins, props) {
  var modelsRef = React.useRef({});
  var _React$useState = React.useState(function () {
      var initialState = {};
      plugins.forEach(function (plugin) {
        if (plugin.models) {
          Object.entries(plugin.models).forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
              modelName = _ref2[0],
              model = _ref2[1];
            modelsRef.current[modelName] = {
              controlledProp: model.controlledProp,
              defaultProp: model.defaultProp,
              isControlled: props[model.controlledProp] !== undefined
            };
            initialState[modelName] = props[model.defaultProp];
          });
        }
      });
      return initialState;
    }),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    modelsState = _React$useState2[0],
    setModelsState = _React$useState2[1];
  var models = Object.fromEntries(Object.entries(modelsRef.current).map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
      modelName = _ref4[0],
      model = _ref4[1];
    var value = model.isControlled ? props[model.controlledProp] : modelsState[modelName];
    return [modelName, {
      value: value,
      setValue: function setValue(newValue) {
        if (!model.isControlled) {
          setModelsState(function (prevState) {
            return _extends({}, prevState, _defineProperty({}, modelName, newValue));
          });
        }
      }
    }];
  }));

  // We know that `modelsRef` do not vary across renders.
  /* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
  if (process.env.NODE_ENV !== 'production') {
    Object.entries(modelsRef.current).forEach(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        modelName = _ref6[0],
        model = _ref6[1];
      var controlled = props[model.controlledProp];
      var defaultProp = props[model.defaultProp];
      React.useEffect(function () {
        if (model.isControlled !== (controlled !== undefined)) {
          console.error(["MUI: A component is changing the ".concat(model.isControlled ? '' : 'un', "controlled ").concat(modelName, " state of TreeView to be ").concat(model.isControlled ? 'un' : '', "controlled."), 'Elements should not switch from uncontrolled to controlled (or vice versa).', "Decide between using a controlled or uncontrolled ".concat(modelName, " ") + 'element for the lifetime of the component.', "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.", 'More info: https://fb.me/react-controlled-components'].join('\n'));
        }
      }, [controlled]);
      var _React$useRef = React.useRef(defaultProp),
        defaultValue = _React$useRef.current;
      React.useEffect(function () {
        if (!model.isControlled && defaultValue !== defaultProp) {
          console.error(["MUI: A component is changing the default ".concat(modelName, " state of an uncontrolled TreeView after being initialized. ") + "To suppress this warning opt to use a controlled TreeView."].join('\n'));
        }
      }, [JSON.stringify(defaultValue)]);
    });
  }
  /* eslint-enable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */

  return models;
};