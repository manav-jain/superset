import { useLingui } from "@lingui/react/macro";
import { LuListChecks } from "react-icons/lu";
import {
	useWorkspaceChecklist,
	WorkspaceChecklist,
} from "../../../WorkspaceChecklist";
import type { SidebarTabDefinition } from "../../types";

/** The checklist the workspace's agent keeps with `superset ws checklist set`. */
export function useChecklistTab({
	workspaceId,
}: {
	workspaceId: string;
}): SidebarTabDefinition {
	const { t } = useLingui();
	const { data } = useWorkspaceChecklist(workspaceId);
	const openCount = (data?.items ?? [])
		.flatMap((item) => [item, ...item.children])
		.filter((entry) => !entry.done).length;

	return {
		id: "checklist",
		label: t({ message: "Checklist", context: "workspace sidebar tab" }),
		icon: LuListChecks,
		badge: openCount > 0 ? openCount : undefined,
		content: <WorkspaceChecklist workspaceId={workspaceId} />,
	};
}
