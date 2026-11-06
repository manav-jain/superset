import { describe, expect, it } from "bun:test";
import {
	findCreatedPullRequestUrls,
	parsePullRequestReference,
} from "./pull-request-links";

describe("parsePullRequestReference", () => {
	it("reads URLs, owner/repo#n, #n and n", () => {
		expect(
			parsePullRequestReference("https://github.com/acme/app/pull/42/files"),
		).toEqual({ owner: "acme", name: "app", number: 42 });
		expect(parsePullRequestReference("acme/app#7")).toEqual({
			owner: "acme",
			name: "app",
			number: 7,
		});
		expect(parsePullRequestReference(" #12 ")).toEqual({
			owner: null,
			name: null,
			number: 12,
		});
		expect(parsePullRequestReference("not a pr")).toBeNull();
	});
});

describe("findCreatedPullRequestUrls", () => {
	const toolUse = (id: string, command: string) =>
		JSON.stringify({
			type: "assistant",
			message: {
				content: [{ type: "tool_use", id, name: "Bash", input: { command } }],
			},
		});
	const toolResult = (id: string, text: string) =>
		JSON.stringify({
			type: "user",
			message: {
				content: [
					{
						type: "tool_result",
						tool_use_id: id,
						content: [{ type: "text", text }],
					},
				],
			},
		});

	it("takes URLs from gh pr create results only, across chunks", () => {
		const pending = new Set<string>();
		expect(
			findCreatedPullRequestUrls(
				[
					toolUse("a", "gh pr create --title x --body y"),
					toolUse("b", "gh pr view 9"),
					toolResult("b", "https://github.com/acme/app/pull/9"),
				],
				pending,
			),
		).toEqual([]);
		expect(
			findCreatedPullRequestUrls(
				[toolResult("a", "https://github.com/acme/app/pull/10\n")],
				pending,
			),
		).toEqual(["https://github.com/acme/app/pull/10"]);
		expect(pending.size).toBe(0);
	});
});
