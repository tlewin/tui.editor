import { includes } from '../util';

const nestableTypes = ['list', 'blockQuote'];
const htmlTypes = ['htmlBlock', 'htmlInline'];
const nestableTagNames = ['UL', 'OL', 'BLOCKQUOTE'];
const tableElementTagNames = ['TR', 'TH', 'TBODY', 'TD'];

export function hasImageOrCodeBlockNode(mdNode) {
  while (mdNode) {
    if (includes(['image', 'codeBlock'], mdNode.type)) {
      return true;
    }
    mdNode = mdNode.firstChild;
  }
  return false;
}

export function isNodeToBeCalculated(mdNode) {
  return !includes(nestableTypes, mdNode.type);
}

export function isHtmlNode(mdNode) {
  return includes(htmlTypes, mdNode.type);
}

export function getAdditionalTopPos(scrollTop, offsetTop, currentNodeHeight, targetNodeHeight) {
  const diff = (scrollTop - offsetTop) / currentNodeHeight;

  return diff < 1 ? diff * targetNodeHeight : targetNodeHeight;
}

export function getParentNodeObj(mdNode) {
  let node = document.querySelector(`[data-nodeid="${mdNode.id}"]`);

  while (!node && mdNode) {
    mdNode = mdNode.parent;
    node = document.querySelector(`[data-nodeid="${mdNode.id}"]`);
  }

  while (includes(tableElementTagNames, mdNode.type) || hasSameLineParent(mdNode)) {
    mdNode = mdNode.parent;
    node = document.querySelector(`[data-nodeid="${mdNode.id}"]`);
  }

  return getNonNestableNodeObj(mdNode, node);
}

function hasSameLineParent(mdNode) {
  return (
    mdNode.parent &&
    mdNode.parent.type !== 'document' &&
    mdNode.parent.sourcepos[0][0] === mdNode.sourcepos[0][0]
  );
}

function getNonNestableNodeObj(mdNode, node) {
  while (includes(nestableTypes, mdNode.type)) {
    mdNode = mdNode.firstChild;
    node = node.firstElementChild;
  }
  return { mdNode, node };
}

export function getCmRangeHeight(start, mdNode, cm) {
  const cmNodeHeight = cm.lineInfo(start).handle.height;
  const end = getMdEndLine(getLastLeafNode(mdNode));
  const height =
    cm.heightAtLine(end, 'local') -
    cm.heightAtLine(start, 'local') -
    getEmptyLineHeight(start, end, cm);

  return height <= 0 ? cmNodeHeight : height;
}

export function isEmptyLineNode(text, mdNode) {
  return !text.trim() && !hasImageOrCodeBlockNode(mdNode);
}

export function getMdStartLine(mdNode) {
  return mdNode.sourcepos[0][0];
}

export function getMdEndLine(mdNode) {
  return mdNode.sourcepos[1][0];
}

export function isMultiLineNode(mdNode) {
  return mdNode.type === 'codeBlock' || mdNode.type === 'paragraph';
}

function getEmptyLineHeight(start, end, cm) {
  let emptyLineHeight = 0;

  for (let i = start; i < end; i += 1) {
    const { text, height } = cm.lineInfo(i).handle;

    if (!text.trim()) {
      emptyLineHeight += height;
    }
  }
  return emptyLineHeight;
}

function getLastLeafNode(mdNode) {
  while (mdNode.lastChild) {
    mdNode = mdNode.lastChild;
  }
  return mdNode;
}

export function getTotalOffsetTop(el, root) {
  let offsetTop = 0;

  while (el && el !== root) {
    if (!includes(nestableTagNames, el.tagName)) {
      offsetTop += el.offsetTop;
    }
    el = el.parentElement;
  }
  return offsetTop;
}

export function findAdjacentElementToScrollTop(scrollTop, root) {
  let el = root;
  let prev = null;

  while (el) {
    const { firstElementChild } = el;

    if (!firstElementChild) {
      break;
    }
    const lastSibling = findLastSiblingElementToScrollTop(
      firstElementChild,
      scrollTop,
      getTotalOffsetTop(el, root)
    );

    prev = el;
    el = lastSibling;
  }

  const adjacentEl = el || prev;

  return adjacentEl === root ? null : adjacentEl;
}

function findLastSiblingElementToScrollTop(el, scrollTop, offsetTop) {
  if (el && scrollTop > offsetTop + el.offsetTop) {
    return findLastSiblingElementToScrollTop(el.nextElementSibling, scrollTop, offsetTop) || el;
  }

  return null;
}