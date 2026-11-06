// A workspace has one repository, so the PR number identifies a PR even when a
// repository rename left an older link under the previous URL.
export function newestPullRequests<
	T extends { number: number; linkedAt: number },
>(history: readonly T[]): T[] {
	const newestFirst = [...history].sort((a, b) => b.linkedAt - a.linkedAt);
	const seen = new Set<number>();
	return newestFirst.filter((pr) => {
		if (seen.has(pr.number)) return false;
		seen.add(pr.number);
		return true;
	});
}

/**
 * Workers can sit in other repositories, so across workspaces the URL names a
 * PR; within one, the number does (see newestPullRequests).
 */
export function newestPullRequestsAcrossWorkspaces<
	T extends { number: number; linkedAt: number; url: string },
>(workspaces: readonly { pullRequests: readonly T[] }[]): T[] {
	const seen = new Set<string>();
	return workspaces
		.flatMap((workspace) => newestPullRequests(workspace.pullRequests))
		.sort((a, b) => b.linkedAt - a.linkedAt)
		.filter((pr) => {
			if (seen.has(pr.url)) return false;
			seen.add(pr.url);
			return true;
		});
}
