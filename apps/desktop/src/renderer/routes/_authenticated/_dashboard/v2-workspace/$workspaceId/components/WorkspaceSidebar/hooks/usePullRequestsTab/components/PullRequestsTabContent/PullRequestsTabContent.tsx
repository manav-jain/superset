import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@superset/ui/button";
import { Input } from "@superset/ui/input";
import { workspaceTrpc } from "@superset/workspace-client";
import { useState } from "react";
import { LuGitPullRequest } from "react-icons/lu";
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
	const unlink = workspaceTrpc.pullRequests.unlinkPullRequest.useMutation({
		onSuccess: () => void refresh(),
	});

	const pullRequests = sections.flatMap((section) => section.pullRequests);
	const linkedCount = pullRequests.length;
	const openCount = pullRequests.filter(
		(pr) => pr.state !== "merged" && pr.state !== "closed",
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
					sections
						.filter((section) => section.pullRequests.length > 0)
						.map((section) => (
							<div key={section.id}>
								{section.id !== workspaceId && (
									<p className="truncate px-2 pt-2 pb-0.5 text-[11px] text-muted-foreground">
										{section.name}
									</p>
								)}
								{section.pullRequests.map((pullRequest) => (
									<PullRequestLinkRow
										key={pullRequest.id}
										pullRequest={pullRequest}
										onOpen={() => open(pullRequest.url)}
										onUnlink={() =>
											unlink.mutate({
												workspaceId: section.id,
												pullRequestId: pullRequest.id,
											})
										}
									/>
								))}
							</div>
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
				<p className="text-[11px] text-muted-foreground">
					<Trans>
						{openCount} open · {linkedCount} linked
					</Trans>
				</p>
			</form>
		</div>
	);
}
