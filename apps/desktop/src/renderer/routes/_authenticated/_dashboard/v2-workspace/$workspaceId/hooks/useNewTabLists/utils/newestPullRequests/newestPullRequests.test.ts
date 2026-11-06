import { describe, expect, test } from "bun:test";
import {
	newestPullRequests,
	newestPullRequestsAcrossWorkspaces,
} from "./newestPullRequests";

describe("newestPullRequests", () => {
	test("newest link first, each PR once even across a repository rename", () => {
		const prs = newestPullRequests([
			{ url: "github.com/old/repo/pull/1", number: 1, linkedAt: 1 },
			{ url: "github.com/new/repo/pull/2", number: 2, linkedAt: 3 },
			{ url: "github.com/new/repo/pull/1", number: 1, linkedAt: 2 },
		]);
		expect(prs.map((pr) => pr.url)).toEqual([
			"github.com/new/repo/pull/2",
			"github.com/new/repo/pull/1",
		]);
	});
});

describe("newestPullRequestsAcrossWorkspaces", () => {
	test("keeps a worker's PR that shares a number with the master's in another repo", () => {
		const prs = newestPullRequestsAcrossWorkspaces([
			{
				pullRequests: [
					{ url: "github.com/a/app/pull/7", number: 7, linkedAt: 1 },
				],
			},
			{
				pullRequests: [
					{ url: "github.com/b/api/pull/7", number: 7, linkedAt: 3 },
					{ url: "github.com/a/app/pull/7", number: 7, linkedAt: 2 },
				],
			},
		]);
		expect(prs.map((pr) => pr.url)).toEqual([
			"github.com/b/api/pull/7",
			"github.com/a/app/pull/7",
		]);
	});
});
