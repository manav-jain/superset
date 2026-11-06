import type { PullRequestRef } from "renderer/lib/github/pullRequestRef";
import { usePullRequestsTab } from "../../../usePullRequestsTab";

interface PullRequestsListPaneProps {
	workspaceId: string;
	onOpenPullRequest: (ref: PullRequestRef) => void;
}

/** The workspace's pull requests and its workers', with the link and refresh controls. */
export function PullRequestsListPane({
	workspaceId,
	onOpenPullRequest,
}: PullRequestsListPaneProps) {
	return usePullRequestsTab({ workspaceId, onOpenPullRequest }).content;
}
