import { useLingui } from "@lingui/react/macro";
import { workspaceTrpc } from "@superset/workspace-client";
import { LuListChecks } from "react-icons/lu";
import type { SidebarTabDefinition } from "../../types";
import { ChecklistTabContent } from "./components/ChecklistTabContent";

/** The checklist the workspace's agent keeps with `superset ws checklist set`. */
export function useChecklistTab({
	workspaceId,
}: {
	workspaceId: string;
}): SidebarTabDefinition {
	const { t } = useLingui();
	const { data } = workspaceTrpc.workspace.checklist.useQuery(
		{ id: workspaceId },
		{ refetchInterval: 3_000, refetchOnWindowFocus: true },
	);
	const openCount = (data?.items ?? [])
		.flatMap((item) => [item, ...item.children])
		.filter((entry) => !entry.done).length;

	return {
		id: "checklist",
		label: t({ message: "Checklist", context: "workspace sidebar tab" }),
		icon: LuListChecks,
		badge: openCount > 0 ? openCount : undefined,
		content: <ChecklistTabContent workspaceId={workspaceId} checklist={data} />,
	};
}
