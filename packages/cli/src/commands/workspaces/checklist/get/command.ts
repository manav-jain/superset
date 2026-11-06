import { formatWorkspaceChecklist } from "@superset/shared/workspace-checklist";
import { command } from "../../../../lib/command";
import { resolveHostClient } from "../../../../lib/resolve-host-client";
import { checklistOptions, checklistWorkspaceId } from "../shared";

export default command({
	description:
		"Print the workspace's checklist as markdown: `- [x]` is done, an indented line is a sub-item",
	options: checklistOptions,
	run: async ({ ctx, options }) => {
		const id = checklistWorkspaceId(options);
		const client = await resolveHostClient(ctx, options);
		const checklist = await client.workspace.checklist.query({ id });
		return {
			data: checklist,
			message: formatWorkspaceChecklist(checklist.items) || "No checklist",
		};
	},
});
