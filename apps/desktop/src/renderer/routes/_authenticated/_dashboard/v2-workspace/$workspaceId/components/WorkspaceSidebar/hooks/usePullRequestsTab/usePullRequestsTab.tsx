import { useLingui } from "@lingui/react/macro";
import { workspaceTrpc } from "@superset/workspace-client";
import { useMemo } from "react";
import { LuGitPullRequest } from "react-icons/lu";
import type { PullRequestRef } from "renderer/lib/github/pullRequestRef";
import type { SidebarTabDefinition } from "../../types";
import { PullRequestsTabContent } from "./components/PullRequestsTabContent";
import type { PullRequestSection } from "./types";
import { collectWorkspaceTree } from "./utils/collectWorkspaceTree";

interface UsePullRequestsTabParams {
	workspaceId: string;
	onOpenPullRequest?: (ref: PullRequestRef) => void;
}

/** The workspace's linked PRs, plus those of every worker nested under it, deleted ones included. */
export function usePullRequestsTab({
	workspaceId,
	onOpenPullRequest,
}: UsePullRequestsTabParams): SidebarTabDefinition {
	const { t } = useLingui();
	const workspacesQuery = workspaceTrpc.workspace.list.useQuery(
		{ includeArchived: true },
		{ staleTime: 30_000 },
	);
	const tree = useMemo(
		() => collectWorkspaceTree(workspacesQuery.data ?? [], workspaceId),
		[workspacesQuery.data, workspaceId],
	);
	const historyQuery = workspaceTrpc.pullRequests.historyByWorkspaces.useQuery(
		{ workspaceIds: tree.map((node) => node.id) },
		{ refetchInterval: 10_000, refetchOnWindowFocus: true },
	);
	const sections = useMemo<PullRequestSection[]>(
		() =>
			tree.map((node) => ({
				...node,
				pullRequests:
					historyQuery.data?.workspaces.find(
						(entry) => entry.workspaceId === node.id,
					)?.pullRequests ?? [],
			})),
		[tree, historyQuery.data],
	);
	const openCount = sections
		.flatMap((section) => section.pullRequests)
		.filter((pr) => pr.state !== "merged" && pr.state !== "closed").length;

	return {
		id: "pull-requests",
		label: t({ message: "PRs", context: "workspace sidebar tab" }),
		icon: LuGitPullRequest,
		badge: openCount > 0 ? openCount : undefined,
		content: (
			<PullRequestsTabContent
				workspaceId={workspaceId}
				sections={sections}
				onOpenPullRequest={onOpenPullRequest}
			/>
		),
	};
}
