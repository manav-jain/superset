import { workspaceTrpc } from "@superset/workspace-client";
import { useMemo } from "react";
import { cloudTrpc } from "renderer/lib/cloud-trpc";
import { pagesListInput } from "renderer/routes/_authenticated/_dashboard/utils/pagesListInput";
import { collectWorkspaceTree } from "../../utils/collectWorkspaceTree";
import { newestPullRequestsAcrossWorkspaces } from "./utils/newestPullRequests";

const PAGE_LIMIT = 4;
const REFRESH_MS = 60_000;

export function useNewTabLists(workspaceId: string) {
	const refresh = { staleTime: REFRESH_MS, refetchInterval: REFRESH_MS };
	const pages = cloudTrpc.page.listPaginated.useQuery(
		pagesListInput({ workspaceId, limit: PAGE_LIMIT }),
		refresh,
	);
	// A master lists its workers' pull requests too, deleted workers included.
	const workspaces = workspaceTrpc.workspace.list.useQuery(
		{ includeArchived: true },
		{ staleTime: 30_000 },
	);
	const workspaceIds = useMemo(
		() =>
			collectWorkspaceTree(workspaces.data ?? [], workspaceId).map(
				(node) => node.id,
			),
		[workspaces.data, workspaceId],
	);
	const history = workspaceTrpc.pullRequests.historyByWorkspaces.useQuery(
		{ workspaceIds },
		refresh,
	);

	return {
		pages: pages.data?.items.slice(0, PAGE_LIMIT) ?? [],
		pullRequests: newestPullRequestsAcrossWorkspaces(
			history.data?.workspaces ?? [],
		).map((pr) => ({
			...pr,
			ref: {
				repoFullName: `${pr.repoOwner}/${pr.repoName}`,
				number: pr.number,
			},
		})),
	};
}

export type NewTabLists = ReturnType<typeof useNewTabLists>;
