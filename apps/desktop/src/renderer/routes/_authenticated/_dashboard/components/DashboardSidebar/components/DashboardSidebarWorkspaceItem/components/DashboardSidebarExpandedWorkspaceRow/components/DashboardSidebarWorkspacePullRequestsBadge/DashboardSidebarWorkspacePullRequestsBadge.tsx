import { Trans } from "@lingui/react/macro";
import { Tooltip, TooltipContent, TooltipTrigger } from "@superset/ui/tooltip";
import { PRIcon } from "renderer/screens/main/components/PRIcon";
import type { DashboardSidebarPullRequestLink } from "../../../../../../types";
import { aggregatePullRequestState } from "./utils/aggregatePullRequestState";

interface DashboardSidebarWorkspacePullRequestsBadgeProps {
	links: DashboardSidebarPullRequestLink[];
}

export function DashboardSidebarWorkspacePullRequestsBadge({
	links,
}: DashboardSidebarWorkspacePullRequestsBadgeProps) {
	const [first] = links;
	if (!first) return null;
	const count = links.length;
	const state = aggregatePullRequestState(links.map((link) => link.state));

	return (
		<Tooltip delayDuration={300}>
			<TooltipTrigger asChild>
				<span className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] tabular-nums text-muted-foreground group-hover:hidden group-focus-within:hidden">
					<PRIcon state={state} className="size-3" />
					{count === 1 ? `#${first.number}` : `+${count}`}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top" className="max-w-64">
				{count === 1 ? (
					<Trans>
						PR #{first.number}: {first.title}
					</Trans>
				) : (
					<Trans>{count} linked pull requests</Trans>
				)}
			</TooltipContent>
		</Tooltip>
	);
}
