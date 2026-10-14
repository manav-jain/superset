import {
	$getSelection,
	$isLineBreakNode,
	$isRangeSelection,
	$isTextNode,
	type LexicalNode,
} from "lexical";

const LIST_ITEM = /^(\s*)(?:([-*+])|(\d+)([.)]))\s/;
const EMPTY_LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s*$/;

export function nextListMarker(line: string): string | null {
	const match = LIST_ITEM.exec(line);
	if (!match) return null;
	const [, indent, bullet, number, delimiter] = match;
	return bullet
		? `${indent}${bullet} `
		: `${indent}${Number(number) + 1}${delimiter} `;
}

export function $continueList(): boolean {
	const selection = $getSelection();
	if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
	const anchor = selection.anchor.getNode();
	if (!$isTextNode(anchor)) return false;

	let first: LexicalNode = anchor;
	for (
		let prev = first.getPreviousSibling();
		prev && !$isLineBreakNode(prev);
		prev = prev.getPreviousSibling()
	)
		first = prev;
	let line = "";
	for (
		let node: LexicalNode | null = first;
		node && !$isLineBreakNode(node);
		node = node.getNextSibling()
	)
		line += node.getTextContent();

	if (EMPTY_LIST_ITEM.test(line)) {
		if (line !== anchor.getTextContent()) return false;
		anchor.select(0, anchor.getTextContentSize()).removeText();
		return true;
	}
	const marker = nextListMarker(line);
	if (marker === null) return false;
	selection.insertLineBreak();
	$getSelection()?.insertText(marker);
	return true;
}
