import { useLingui } from "@lingui/react/macro";
import { cn } from "@superset/ui/utils";
import {
	LuCircleCheck,
	LuCircleDashed,
	LuCircleX,
	LuUnlink,
} from "react-icons/lu";
import { PRIcon } from "renderer/screens/main/components/PRIcon";
import type { WorkspacePullRequest } from "../../../../types";

interface PullRequestLinkRowProps {
	pullRequest: WorkspacePullRequest;
	onOpen: () => void;
	onUnlink: () => void;
}

const CHECK_ICONS = {
	success: { icon: LuCircleCheck, className: "text-emerald-500" },
	failure: { icon: LuCircleX, className: "text-red-500" },
	pending: { icon: LuCircleDashed, className: "text-amber-500" },
} as const;

export function PullRequestLinkRow({
	pullRequest,
	onOpen,
	onUnlink,
}: PullRequestLinkRowProps) {
	const { t } = useLingui();
	const sourceLabel =
		pullRequest.source === "created"
			? t({ message: "Created in an agent session in this workspace" })
			: pullRequest.source === "manual"
				? t({ message: "Linked by you" })
				: t({ message: "Matched by this workspace's branch" });
	const isActive =
		pullRequest.state !== "merged" && pullRequest.state !== "closed";
	const checks =
		isActive && pullRequest.checksStatus !== "none"
			? CHECK_ICONS[pullRequest.checksStatus]
			: null;

	return (
		<div className="group flex items-center gap-1.5 px-2 py-1 hover:bg-accent/50">
			<button
				type="button"
				onClick={onOpen}
				title={pullRequest.title}
				className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
			>
				<PRIcon state={pullRequest.state} className="size-3.5 shrink-0" />
				<span
					className="shrink-0 font-mono text-[11px] text-muted-foreground"
					title={sourceLabel}
				>
					#{pullRequest.number}
				</span>
				<span className="min-w-0 flex-1 truncate text-xs">
					{pullRequest.title}
				</span>
			</button>
			{checks && (
				<checks.icon className={cn("size-3 shrink-0", checks.className)} />
			)}
			<button
				type="button"
				onClick={onUnlink}
				aria-label={t({
					message: `Unlink pull request #${pullRequest.number}`,
				})}
				title={t({ message: "Unlink" })}
				className="hidden shrink-0 text-muted-foreground hover:text-foreground group-hover:flex group-focus-within:flex"
			>
				<LuUnlink className="size-3" />
			</button>
		</div>
	);
}
