import { describe, expect, it } from "bun:test";
import { collectWorkspaceTree } from "./collectWorkspaceTree";

describe("collectWorkspaceTree", () => {
	it("returns the root, then its workers and their workers, once each", () => {
		const tree = collectWorkspaceTree(
			[
				{ id: "m", name: "master" },
				{ id: "w1", name: "worker 1", parentWorkspaceId: "m" },
				{ id: "w2", name: "worker 2", parentWorkspaceId: "m" },
				{ id: "s", name: "sub", parentWorkspaceId: "w1" },
				{ id: "x", name: "other", parentWorkspaceId: null },
				{ id: "loop", name: "loop", parentWorkspaceId: "loop" },
			],
			"m",
		);
		expect(tree.map((node) => node.id)).toEqual(["m", "w1", "w2", "s"]);
	});
});
