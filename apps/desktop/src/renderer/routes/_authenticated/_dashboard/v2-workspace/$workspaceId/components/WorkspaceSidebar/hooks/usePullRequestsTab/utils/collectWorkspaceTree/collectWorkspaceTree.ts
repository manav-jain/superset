export interface WorkspaceTreeNode {
	id: string;
	name: string;
}

/** The workspace, then every workspace nested under it (its workers), depth first. */
export function collectWorkspaceTree(
	workspaces: ReadonlyArray<{
		id: string;
		name: string;
		parentWorkspaceId?: string | null;
	}>,
	rootId: string,
): WorkspaceTreeNode[] {
	const root = workspaces.find((workspace) => workspace.id === rootId);
	const nodes: WorkspaceTreeNode[] = [{ id: rootId, name: root?.name ?? "" }];
	const seen = new Set([rootId]);
	for (let index = 0; index < nodes.length; index++) {
		const parentId = nodes[index]?.id;
		for (const workspace of workspaces) {
			if (workspace.parentWorkspaceId !== parentId || seen.has(workspace.id))
				continue;
			seen.add(workspace.id);
			nodes.push({ id: workspace.id, name: workspace.name });
		}
	}
	return nodes;
}
