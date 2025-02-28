import _extends from "@babel/runtime/helpers/esm/extends";
export var getPreviousNode = function getPreviousNode(instance, nodeId) {
  var node = instance.getNode(nodeId);
  var siblings = instance.getNavigableChildrenIds(node.parentId);
  var nodeIndex = siblings.indexOf(nodeId);
  if (nodeIndex === 0) {
    return node.parentId;
  }
  var currentNode = siblings[nodeIndex - 1];
  while (instance.isNodeExpanded(currentNode) && instance.getNavigableChildrenIds(currentNode).length > 0) {
    currentNode = instance.getNavigableChildrenIds(currentNode).pop();
  }
  return currentNode;
};
export var getNextNode = function getNextNode(instance, nodeId) {
  // If expanded get first child
  if (instance.isNodeExpanded(nodeId) && instance.getNavigableChildrenIds(nodeId).length > 0) {
    return instance.getNavigableChildrenIds(nodeId)[0];
  }
  var node = instance.getNode(nodeId);
  while (node != null) {
    // Try to get next sibling
    var siblings = instance.getNavigableChildrenIds(node.parentId);
    var nextSibling = siblings[siblings.indexOf(node.id) + 1];
    if (nextSibling) {
      return nextSibling;
    }

    // If the sibling does not exist, go up a level to the parent and try again.
    node = instance.getNode(node.parentId);
  }
  return null;
};
export var getLastNode = function getLastNode(instance) {
  var lastNode = instance.getNavigableChildrenIds(null).pop();
  while (instance.isNodeExpanded(lastNode)) {
    lastNode = instance.getNavigableChildrenIds(lastNode).pop();
  }
  return lastNode;
};
export var getFirstNode = function getFirstNode(instance) {
  return instance.getNavigableChildrenIds(null)[0];
};
export var populateInstance = function populateInstance(instance, methods) {
  _extends(instance, methods);
};