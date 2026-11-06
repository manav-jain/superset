import { CLIError, string } from "@superset/cli-framework";

export const checklistOptions = {
	workspace: string().desc("Workspace ID (default: $SUPERSET_WORKSPACE_ID)"),
	host: string().desc("Host the workspace lives on (default: this machine)"),
};

export function checklistWorkspaceId(options: { workspace?: string }): string {
	const id = options.workspace ?? process.env.SUPERSET_WORKSPACE_ID;
	if (!id) {
		throw new CLIError(
			"No workspace id",
			"Pass --workspace, or run inside a workspace where $SUPERSET_WORKSPACE_ID is set",
		);
	}
	return id;
}
