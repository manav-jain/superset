import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@superset/ui/button";
import { Input } from "@superset/ui/input";
import { cn } from "@superset/ui/utils";
import { workspaceTrpc } from "@superset/workspace-client";
import { useState } from "react";
import { LuGitPullRequest, LuRefreshCw } from "react-icons/lu";
import { pullRequestClickProps } from "renderer/lib/github/pullRequestClickProps";
import {
	type PullRequestRef,
	pullRequestRefFromUrl,
} from "renderer/lib/github/pullRequestRef";
import type { PullRequestSection } from "../../types";
import { PullRequestLinkRow } from "./components/PullRequestLinkRow";

interface PullRequestsTabContentProps {
	workspaceId: string;
	sections: PullRequestSection[];
	onOpenPullRequest?: (ref: PullRequestRef) => void;
}

export function PullRequestsTabContent({
	workspaceId,
	sections,
	onOpenPullRequest,
}: PullRequestsTabContentProps) {
	const { t } = useLingui();
	const utils = workspaceTrpc.useUtils();
	const [reference, setReference] = useState("");
	const refresh = () => utils.pullRequests.historyByWorkspaces.invalidate();
	const link = workspaceTrpc.pullRequests.linkToWorkspace.useMutation({
		onSuccess: () => {
			setReference("");
			void refresh();
		},
	});
	const refreshBranches =
		workspaceTrpc.pullRequests.refreshByWorkspaces.useMutation();
	const refreshLinked =
		workspaceTrpc.pullRequests.refreshPullRequests.useMutation();
	const unlink = workspaceTrpc.pullRequests.unlinkPullRequest.useMutation({
		onSuccess: () => void refresh(),
	});

	const seen = new Set<string>();
	const pullRequests = sections.flatMap((section) =>
		section.pullRequests.flatMap((pullRequest) => {
			if (seen.has(pullRequest.id)) return [];
			seen.add(pullRequest.id);
			return [{ pullRequest, workspaceId: section.id }];
		}),
	);
	const linkedCount = pullRequests.length;
	const isRefreshing = refreshBranches.isPending || refreshLinked.isPending;
	const refreshError = refreshBranches.error ?? refreshLinked.error;
	const refreshAll = () =>
		void Promise.allSettled([
			refreshBranches.mutateAsync({
				workspaceIds: sections.map((section) => section.id),
			}),
			refreshLinked.mutateAsync({
				pullRequestIds: pullRequests.map(({ pullRequest }) => pullRequest.id),
			}),
		]).then(refresh);
	const openCount = pullRequests.filter(
		({ pullRequest }) =>
			pullRequest.state !== "merged" && pullRequest.state !== "closed",
	).length;
	const open = (url: string) => {
		const ref = pullRequestRefFromUrl(url);
		if (ref && onOpenPullRequest) onOpenPullRequest(ref);
		else window.open(url, "_blank");
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto py-1">
				{linkedCount === 0 ? (
					<div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
						<LuGitPullRequest className="size-5 text-muted-foreground" />
						<p className="text-xs font-medium">
							<Trans>No linked pull requests</Trans>
						</p>
						<p className="text-[11px] text-muted-foreground">
							<Trans>
								Pull requests an agent opens from this workspace, or its
								workers, land here. Link others by URL or number.
							</Trans>
						</p>
					</div>
				) : (
					pullRequests.map(({ pullRequest, workspaceId: ownerId }) => (
						<PullRequestLinkRow
							key={pullRequest.id}
							pullRequest={pullRequest}
							openProps={pullRequestClickProps(pullRequest.url, () =>
								open(pullRequest.url),
							)}
							onUnlink={() =>
								unlink.mutate({
									workspaceId: ownerId,
									pullRequestId: pullRequest.id,
								})
							}
						/>
					))
				)}
			</div>
			<form
				className="space-y-1 border-t px-2 py-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (reference.trim()) link.mutate({ workspaceId, reference });
				}}
			>
				<div className="flex gap-1.5">
					<Input
						value={reference}
						onChange={(event) => setReference(event.target.value)}
						placeholder={t({ message: "Pull request URL or #123" })}
						className="h-7 text-xs"
					/>
					<Button
						type="submit"
						size="sm"
						variant="secondary"
						className="h-7"
						disabled={link.isPending || !reference.trim()}
					>
						{link.isPending ? <Trans>Linking…</Trans> : <Trans>Link</Trans>}
					</Button>
				</div>
				{link.error && (
					<p className="text-[11px] text-destructive">{link.error.message}</p>
				)}
				<div className="flex items-center justify-between gap-1.5">
					<p className="text-[11px] text-muted-foreground">
						<Trans>
							{openCount} open · {linkedCount} linked
						</Trans>
					</p>
					<button
						type="button"
						onClick={refreshAll}
						disabled={isRefreshing}
						aria-label={t({ message: "Refresh pull requests" })}
						title={
							refreshError
								? refreshError.message
								: t({ message: "Refresh pull requests" })
						}
						className={cn(
							"shrink-0 text-muted-foreground hover:text-foreground",
							refreshError && "text-destructive",
						)}
					>
						<LuRefreshCw
							className={cn("size-3", isRefreshing && "animate-spin")}
						/>
					</button>
				</div>
			</form>
		</div>
	);
}
