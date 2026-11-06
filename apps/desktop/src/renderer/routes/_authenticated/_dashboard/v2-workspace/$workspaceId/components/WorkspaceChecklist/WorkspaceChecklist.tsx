import { Trans } from "@lingui/react/macro";
import { workspaceTrpc } from "@superset/workspace-client";
import { ChecklistItems } from "./components/ChecklistItems";

/** The checklist the workspace's agent keeps with `superset ws checklist set`. */
export function WorkspaceChecklist({ workspaceId }: { workspaceId: string }) {
	const { data: checklist } = useWorkspaceChecklist(workspaceId);
	const utils = workspaceTrpc.useUtils();
	const save = workspaceTrpc.workspace.setChecklist.useMutation({
		onSuccess: (saved) =>
			utils.workspace.checklist.setData({ id: workspaceId }, saved),
		onError: () => utils.workspace.checklist.invalidate({ id: workspaceId }),
	});

	if (!checklist?.items.length) {
		return (
			<div className="flex h-full w-full min-w-0 flex-1 flex-col items-center justify-center gap-1 p-4 text-center text-muted-foreground text-xs">
				<Trans>No checklist yet</Trans>
				<span className="max-w-full break-words text-[11px]">
					<Trans>
						The agent in this workspace can keep one with{" "}
						<code className="whitespace-normal break-words">
							superset ws checklist set
						</code>
					</Trans>
				</span>
			</div>
		);
	}

	const { items, updatedAt } = checklist;
	const entries = items.flatMap((item) => [item, ...item.children]);
	const doneCount = entries.filter((entry) => entry.done).length;
	const total = entries.length;

	function setDone(index: number, childIndex: number | null, done: boolean) {
		const next = items.map((item, i) => {
			if (i !== index) return item;
			if (childIndex === null) return { ...item, done };
			return {
				...item,
				children: item.children.map((child, j) =>
					j === childIndex ? { ...child, done } : child,
				),
			};
		});
		utils.workspace.checklist.setData(
			{ id: workspaceId },
			{ items: next, updatedAt },
		);
		save.mutate({ id: workspaceId, items: next, baseUpdatedAt: updatedAt });
	}

	return (
		<div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto p-2 text-xs">
			<div className="px-1.5 pb-1 text-muted-foreground">
				<Trans>
					{doneCount} of {total} done
				</Trans>
			</div>
			<ChecklistItems
				items={items}
				disabled={save.isPending}
				onDoneChange={setDone}
			/>
		</div>
	);
}

export function useWorkspaceChecklist(workspaceId: string) {
	return workspaceTrpc.workspace.checklist.useQuery(
		{ id: workspaceId },
		{ refetchInterval: 3_000, refetchOnWindowFocus: true },
	);
}
