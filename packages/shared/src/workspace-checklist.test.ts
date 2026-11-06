import { describe, expect, test } from "bun:test";
import {
	formatWorkspaceChecklist,
	parseWorkspaceChecklist,
} from "./workspace-checklist";

describe("parseWorkspaceChecklist", () => {
	test("reads ticks, nests indented lines one level, and skips prose", () => {
		const items = parseWorkspaceChecklist(
			[
				"Next steps:",
				"- [x] Upload evidence",
				"- [ ] Deploy #34795",
				"  - [x] Merge it",
				"    - [ ] deeper lines stay one level down",
				"1. Tell finance",
			].join("\n"),
		);
		expect(items).toEqual([
			{ text: "Upload evidence", done: true, children: [] },
			{
				text: "Deploy #34795",
				done: false,
				children: [
					{ text: "Merge it", done: true },
					{ text: "deeper lines stay one level down", done: false },
				],
			},
			{ text: "Tell finance", done: false, children: [] },
		]);
	});

	test("round-trips through the markdown format", () => {
		const markdown = "- [ ] One\n  - [x] One a\n- [x] Two";
		expect(formatWorkspaceChecklist(parseWorkspaceChecklist(markdown))).toBe(
			markdown,
		);
	});
});
