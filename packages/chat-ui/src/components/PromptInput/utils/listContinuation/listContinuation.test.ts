import { describe, expect, it } from "bun:test";
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	createEditor,
} from "lexical";
import { $continueList } from "./listContinuation";

function shiftEnterAfter(text: string) {
	const editor = createEditor({
		namespace: "list-continuation-test",
		onError: (error) => {
			throw error;
		},
	});
	let handled = false;
	editor.update(
		() => {
			const paragraph = $createParagraphNode();
			text.split("\n").forEach((line, index) => {
				if (index > 0) paragraph.append($createLineBreakNode());
				paragraph.append($createTextNode(line));
			});
			$getRoot().clear().append(paragraph);
			paragraph.selectEnd();
			handled = $continueList();
		},
		{ discrete: true },
	);
	return {
		handled,
		text: editor.getEditorState().read(() => $getRoot().getTextContent()),
	};
}

describe("$continueList", () => {
	it("continues bullets and numbers, ends an empty item, ignores plain text", () => {
		expect(shiftEnterAfter("- club the names")).toEqual({
			handled: true,
			text: "- club the names\n- ",
		});
		expect(shiftEnterAfter("  9. ninth").text).toBe("  9. ninth\n  10. ");
		expect(shiftEnterAfter("- one\n- ")).toEqual({
			handled: true,
			text: "- one\n",
		});
		expect(shiftEnterAfter("plain text").handled).toBe(false);
	});
});
