import { describe, expect, test } from "bun:test";
import { desktopWorkspaceLink } from "./open-url";

describe("desktopWorkspaceLink", () => {
	test("links to the desktop app that owns the CLI's home", () => {
		expect(desktopWorkspaceLink("ws-1", "/Users/me/.superset")).toBe(
			"superset://v2-workspace/ws-1",
		);
		expect(desktopWorkspaceLink("ws-1", "/Users/me/.superset-mj")).toBe(
			"superset-mj://v2-workspace/ws-1",
		);
		expect(desktopWorkspaceLink("ws-1", "/repo/superset-dev-data")).toBe(
			"superset://v2-workspace/ws-1",
		);
		expect(desktopWorkspaceLink("ws-1", undefined)).toBe(
			"superset://v2-workspace/ws-1",
		);
	});
});
