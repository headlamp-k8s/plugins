/**
 * This is used to determine the start and end of a selection range so
 * we can get the nodes between the two border nodes.
 *
 * It finds the nodes' common ancestor using
 * a naive implementation of a lowest common ancestor algorithm
 * (https://en.wikipedia.org/wiki/Lowest_common_ancestor).
 * Then compares the ancestor's 2 children that are ancestors of nodeA and NodeB
 * so we can compare their indexes to work out which node comes first in a depth first search.
 * (https://en.wikipedia.org/wiki/Depth-first_search)
 *
 * Another way to put it is which node is shallower in a trémaux tree
 * https://en.wikipedia.org/wiki/Tr%C3%A9maux_tree
 */
export var findOrderInTremauxTree = function findOrderInTremauxTree(instance, nodeAId, nodeBId) {
  if (nodeAId === nodeBId) {
    return [nodeAId, nodeBId];
  }
  var nodeA = instance.getNode(nodeAId);
  var nodeB = instance.getNode(nodeBId);
  if (nodeA.parentId === nodeB.id || nodeB.parentId === nodeA.id) {
    return nodeB.parentId === nodeA.id ? [nodeA.id, nodeB.id] : [nodeB.id, nodeA.id];
  }
  var aFamily = [nodeA.id];
  var bFamily = [nodeB.id];
  var aAncestor = nodeA.parentId;
  var bAncestor = nodeB.parentId;
  var aAncestorIsCommon = bFamily.indexOf(aAncestor) !== -1;
  var bAncestorIsCommon = aFamily.indexOf(bAncestor) !== -1;
  var continueA = true;
  var continueB = true;
  while (!bAncestorIsCommon && !aAncestorIsCommon) {
    if (continueA) {
      aFamily.push(aAncestor);
      aAncestorIsCommon = bFamily.indexOf(aAncestor) !== -1;
      continueA = aAncestor !== null;
      if (!aAncestorIsCommon && continueA) {
        aAncestor = instance.getNode(aAncestor).parentId;
      }
    }
    if (continueB && !aAncestorIsCommon) {
      bFamily.push(bAncestor);
      bAncestorIsCommon = aFamily.indexOf(bAncestor) !== -1;
      continueB = bAncestor !== null;
      if (!bAncestorIsCommon && continueB) {
        bAncestor = instance.getNode(bAncestor).parentId;
      }
    }
  }
  var commonAncestor = aAncestorIsCommon ? aAncestor : bAncestor;
  var ancestorFamily = instance.getChildrenIds(commonAncestor);
  var aSide = aFamily[aFamily.indexOf(commonAncestor) - 1];
  var bSide = bFamily[bFamily.indexOf(commonAncestor) - 1];
  return ancestorFamily.indexOf(aSide) < ancestorFamily.indexOf(bSide) ? [nodeAId, nodeBId] : [nodeBId, nodeAId];
};