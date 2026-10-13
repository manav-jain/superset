import { describe, expect, it } from "bun:test";
import { aggregatePullRequestState } from "./aggregatePullRequestState";

describe("aggregatePullRequestState", () => {
	it("reads in-flight, then draft, then merged, else closed", () => {
		expect(aggregatePullRequestState(["merged", "queued"])).toBe("open");
		expect(aggregatePullRequestState(["draft", "draft"])).toBe("draft");
		expect(aggregatePullRequestState(["draft", "merged"])).toBe("open");
		expect(aggregatePullRequestState(["merged", "merged"])).toBe("merged");
		expect(aggregatePullRequestState(["merged", "closed"])).toBe("closed");
	});
});
